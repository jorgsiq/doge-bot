import { ChannelType, EmbedBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { describe, localize } from '../lib/i18n.js';
import { ephemeral } from '../lib/replies.js';
import { guildT } from '../lib/settings.js';

export const category = 'admin';

export const data = describe(new SlashCommandBuilder().setName('delete'), 'delete')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .setContexts(InteractionContextType.Guild)
  .addIntegerOption((option) => localize(option, 'delete.options.amount').setRequired(true).setMinValue(1).setMaxValue(100))
  .addChannelOption((option) =>
    localize(option, 'delete.options.channel').addChannelTypes(
      ChannelType.GuildText,
      ChannelType.GuildAnnouncement,
      ChannelType.GuildVoice,
    ),
  );

export async function execute(interaction) {
  const t = guildT(interaction.guildId);
  const amount = interaction.options.getInteger('amount', true);
  const channel = interaction.options.getChannel('channel') ?? interaction.channel;

  // the command permission is checked where it was used, not in the target channel
  if (!channel.permissionsFor(interaction.member).has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply(ephemeral(t('delete.cannot', { channel })));
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const deleted = await channel.bulkDelete(amount, true);

  const summary = deleted.size ? t('delete.done', { count: deleted.size, channel }) : t('delete.none', { channel });
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle(t('delete.title'))
    .setDescription(deleted.size < amount ? `${summary}\n\n${t('delete.old')}` : summary)
    .setFooter({ text: t('delete.footer') })
    .setTimestamp();
  await interaction.editReply({ embeds: [embed] });
}
