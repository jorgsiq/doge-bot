import { EmbedBuilder, InteractionContextType, SlashCommandBuilder, TimestampStyles, time, version as discordJsVersion } from 'discord.js';
import pkg from '../../package.json' with { type: 'json' };
import config from '../config.js';
import { describe } from '../lib/i18n.js';
import { legalRow } from '../lib/legal.js';
import { ephemeral } from '../lib/replies.js';
import { guildT } from '../lib/settings.js';

export const category = 'info';

export const data = describe(new SlashCommandBuilder().setName('about'), 'about').setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const { client } = interaction;
  const t = guildT(interaction.guildId);
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle('Đoge Bot')
    .setDescription(t('about.embed.description', { repository: config.repositoryUrl }))
    .setImage(config.images.version)
    .addFields(
      { name: t('about.embed.version'), value: pkg.version, inline: true },
      { name: 'discord.js', value: discordJsVersion, inline: true },
      { name: 'Node.js', value: process.version, inline: true },
      { name: t('about.embed.onlineSince'), value: time(client.readyAt, TimestampStyles.RelativeTime), inline: true },
      { name: t('about.embed.latency'), value: client.ws.ping >= 0 ? `${client.ws.ping} ms` : t('about.embed.measuring'), inline: true },
      { name: t('about.embed.author'), value: 'Jorge Siqueira', inline: true },
    )
    .setFooter({ text: t('about.embed.footer', { email: config.supportEmail }) });

  await interaction.reply(ephemeral({ embeds: [embed], components: [legalRow(t)] }));
}
