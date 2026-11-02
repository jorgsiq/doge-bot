import {
  ChannelType,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import config from '../config.js';

export const category = 'Admin';

export const data = new SlashCommandBuilder()
  .setName('delete')
  .setDescription('Apaga as últimas mensagens de um canal')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .setContexts(InteractionContextType.Guild)
  .addIntegerOption((option) =>
    option.setName('quantidade').setDescription('Quantas mensagens apagar').setRequired(true).setMinValue(1).setMaxValue(100),
  )
  .addChannelOption((option) =>
    option
      .setName('canal')
      .setDescription('Canal a limpar (padrão: este canal)')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildVoice),
  );

export async function execute(interaction) {
  const amount = interaction.options.getInteger('quantidade', true);
  const channel = interaction.options.getChannel('canal') ?? interaction.channel;

  // the command permission is checked where it was used, not in the target channel
  if (!channel.permissionsFor(interaction.member).has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({ content: `Opa! parece que você não pode apagar mensagens em ${channel}..`, flags: MessageFlags.Ephemeral });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const deleted = await channel.bulkDelete(amount, true);

  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle('Novinho em Folha!')
    .setDescription(
      `Apaguei as ${deleted.size} últimas mensagens em ${channel}` +
        (deleted.size < amount ? '\n\nMensagens com mais de 14 dias não podem ser apagadas em massa.' : ''),
    )
    .setFooter({ text: 'Limpeza Concluída' })
    .setTimestamp();
  await interaction.editReply({ embeds: [embed] });
}
