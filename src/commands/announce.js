import { extname } from 'node:path';
import {
  AttachmentBuilder,
  ChannelType,
  EmbedBuilder,
  InteractionContextType,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import config from '../config.js';
import { getRole, getSetting } from '../lib/settings.js';

export const category = 'Admin';

export const data = new SlashCommandBuilder()
  .setName('announce')
  .setDescription('Publica um anúncio em um canal')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setContexts(InteractionContextType.Guild)
  .addStringOption((option) =>
    option
      .setName('mencionar')
      .setDescription('Quem será notificado (padrão: ninguém)')
      .addChoices(
        { name: 'Ninguém', value: 'none' },
        { name: '@everyone', value: 'everyone' },
        { name: 'Assinantes dos alertas', value: 'subscribers' },
      ),
  )
  .addChannelOption((option) =>
    option
      .setName('canal')
      .setDescription('Onde publicar (padrão: canal de alertas)')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
  )
  .addAttachmentOption((option) => option.setName('imagem').setDescription('Imagem exibida no anúncio'));

export async function execute(interaction) {
  const mention = interaction.options.getString('mencionar') ?? 'none';
  const image = interaction.options.getAttachment('imagem');
  const channel = interaction.options.getChannel('canal') ?? interaction.guild.channels.cache.get(getSetting(interaction.guildId, 'alertsChannel'));
  const subscribers = getRole(interaction.guild, 'subscriberRole');

  if (!channel) {
    return interaction.reply({ content: 'Opa! não há canal de alertas configurado, escolha um canal na opção **canal**..', flags: MessageFlags.Ephemeral });
  }
  if (mention === 'subscribers' && !subscribers) {
    return interaction.reply({ content: 'Opa! nenhum cargo de assinantes foi escolhido nos alertas de jogos em **/setup**..', flags: MessageFlags.Ephemeral });
  }

  const permissions = channel.permissionsFor(interaction.member);
  if (!permissions.has(PermissionFlagsBits.SendMessages)) {
    return interaction.reply({ content: `Opa! parece que você não pode enviar mensagens em ${channel}..`, flags: MessageFlags.Ephemeral });
  }
  if (mention === 'everyone' && !permissions.has(PermissionFlagsBits.MentionEveryone)) {
    return interaction.reply({ content: 'Opa! parece que você não pode mencionar @everyone..', flags: MessageFlags.Ephemeral });
  }
  if (image && !image.contentType?.startsWith('image/')) {
    return interaction.reply({ content: 'Opa! o anexo precisa ser uma imagem..', flags: MessageFlags.Ephemeral });
  }

  // slash command options are single-line, so the text itself comes from a modal
  const modalId = `announce:${interaction.id}`;
  await interaction.showModal(
    new ModalBuilder()
      .setCustomId(modalId)
      .setTitle('Novo Anúncio')
      .addLabelComponents(
        new LabelBuilder()
          .setLabel('Título')
          .setTextInputComponent(
            new TextInputBuilder().setCustomId('title').setStyle(TextInputStyle.Short).setMaxLength(256).setRequired(false),
          ),
        new LabelBuilder()
          .setLabel('Mensagem')
          .setTextInputComponent(
            new TextInputBuilder().setCustomId('message').setStyle(TextInputStyle.Paragraph).setMaxLength(4000),
          ),
      ),
  );

  const submitted = await interaction
    .awaitModalSubmit({ filter: (i) => i.customId === modalId, time: 15 * 60_000 })
    .catch(() => null);
  // modal closed or timed out
  if (!submitted) return;

  await submitted.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const title = submitted.fields.getTextInputValue('title');
    const embed = new EmbedBuilder()
      .setColor(config.colors.doge)
      .setDescription(submitted.fields.getTextInputValue('message'))
      .setFooter({ text: `Por: @${interaction.user.tag}` })
      .setTimestamp();
    if (title) embed.setTitle(title);

    const payload = { embeds: [embed], files: [] };
    if (image) {
      // re-upload instead of linking: attachment links from interactions expire
      const name = `imagem${extname(image.name) || '.png'}`;
      payload.files.push(new AttachmentBuilder(image.url, { name }));
      embed.setImage(`attachment://${name}`);
    }
    if (mention === 'everyone') {
      Object.assign(payload, { content: '@everyone', allowedMentions: { parse: ['everyone'] } });
    } else if (mention === 'subscribers') {
      Object.assign(payload, { content: `${subscribers}`, allowedMentions: { roles: [subscribers.id] } });
    }

    await channel.send(payload);
    await submitted.editReply(`Encaminhei o anúncio para ${channel}!`);
  } catch (error) {
    console.error('Failed to publish announcement:', error);
    await submitted.editReply(`Desculpe! não consegui publicar o anúncio em ${channel}..`);
  }
}
