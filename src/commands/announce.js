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
import { choice, describe, localize } from '../lib/i18n.js';
import { ephemeral } from '../lib/replies.js';
import { getRole, getSetting, guildT } from '../lib/settings.js';

export const category = 'admin';

export const data = describe(new SlashCommandBuilder().setName('announce'), 'announce')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setContexts(InteractionContextType.Guild)
  .addStringOption((option) =>
    localize(option, 'announce.options.mention').addChoices(
      choice('announce.choices.none', 'none'),
      choice('announce.choices.everyone', 'everyone'),
      choice('announce.choices.subscribers', 'subscribers'),
    ),
  )
  .addChannelOption((option) =>
    localize(option, 'announce.options.channel').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
  )
  .addAttachmentOption((option) => localize(option, 'announce.options.image'));

export async function execute(interaction) {
  const t = guildT(interaction.guildId);
  const mention = interaction.options.getString('mention') ?? 'none';
  const image = interaction.options.getAttachment('image');
  const channel =
    interaction.options.getChannel('channel') ?? interaction.guild.channels.cache.get(getSetting(interaction.guildId, 'alertsChannel'));
  const subscribers = getRole(interaction.guild, 'subscriberRole');

  if (!channel) return interaction.reply(ephemeral(t('announce.errors.noChannel')));
  if (mention === 'subscribers' && !subscribers) return interaction.reply(ephemeral(t('announce.errors.noRole')));

  const permissions = channel.permissionsFor(interaction.member);
  if (!permissions.has(PermissionFlagsBits.SendMessages)) return interaction.reply(ephemeral(t('announce.errors.cannotSend', { channel })));
  if (mention === 'everyone' && !permissions.has(PermissionFlagsBits.MentionEveryone)) {
    return interaction.reply(ephemeral(t('announce.errors.cannotEveryone')));
  }
  if (image && !image.contentType?.startsWith('image/')) return interaction.reply(ephemeral(t('announce.errors.notImage')));

  const modalId = `announce:${interaction.id}`;
  await interaction.showModal(
    new ModalBuilder()
      .setCustomId(modalId)
      .setTitle(t('announce.modal.title'))
      .addLabelComponents(
        new LabelBuilder()
          .setLabel(t('announce.modal.announcementTitle'))
          .setTextInputComponent(
            new TextInputBuilder().setCustomId('title').setStyle(TextInputStyle.Short).setMaxLength(256).setRequired(false),
          ),
        new LabelBuilder()
          .setLabel(t('announce.modal.message'))
          .setTextInputComponent(new TextInputBuilder().setCustomId('message').setStyle(TextInputStyle.Paragraph).setMaxLength(4000)),
      ),
  );

  const submitted = await interaction.awaitModalSubmit({ filter: (i) => i.customId === modalId, time: 15 * 60_000 }).catch(() => null);
  if (!submitted) return;

  await submitted.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const title = submitted.fields.getTextInputValue('title');
    const embed = new EmbedBuilder()
      .setColor(config.colors.doge)
      .setDescription(submitted.fields.getTextInputValue('message'))
      .setFooter({ text: t('announce.footer', { user: interaction.user.tag }) })
      .setTimestamp();
    if (title) embed.setTitle(title);

    const payload = { embeds: [embed], files: [] };
    if (image) {
      // re-upload instead of linking: attachment links from interactions expire
      const name = `image${extname(image.name) || '.png'}`;
      payload.files.push(new AttachmentBuilder(image.url, { name }));
      embed.setImage(`attachment://${name}`);
    }
    if (mention === 'everyone') Object.assign(payload, { content: '@everyone', allowedMentions: { parse: ['everyone'] } });
    else if (mention === 'subscribers') Object.assign(payload, { content: `${subscribers}`, allowedMentions: { roles: [subscribers.id] } });

    await channel.send(payload);
    await submitted.editReply(t('announce.sent', { channel }));
  } catch (error) {
    console.error('Failed to publish announcement:', error);
    await submitted.editReply(t('announce.failed', { channel }));
  }
}
