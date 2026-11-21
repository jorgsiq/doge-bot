import { EmbedBuilder } from 'discord.js';
import config from '../config.js';
import { everyDayAt } from './schedule.js';
import { enabledGuilds, getSetting, guildT } from './settings.js';

// 06:00 in Brasília (UTC-3, no daylight saving time since 2019)
const CLEANUP_HOUR_UTC = 9;

export function scheduleDailyCleanup(client) {
  everyDayAt('cleanup', CLEANUP_HOUR_UTC, 1, () => runCleanup(client));
}

function notice(guildId) {
  const t = guildT(guildId);
  return new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle(t('cleanup.title'))
    .setImage(config.images.clean)
    .setDescription(t('cleanup.description'))
    .setFooter({ text: t('cleanup.footer') })
    .setTimestamp();
}

async function runCleanup(client) {
  for (const guild of enabledGuilds(client, 'cleanup')) {
    for (const channelId of getSetting(guild.id, 'cleanupChannels')) {
      try {
        const channel = await client.channels.fetch(channelId);
        await clearChannel(channel);
        await channel.send({ embeds: [notice(guild.id)] });
      } catch (error) {
        console.error(`Failed to clean channel ${channelId}:`, error);
      }
    }
  }
}

// Discord only bulk deletes messages younger than 14 days, so stop once nothing else can go
async function clearChannel(channel) {
  let deleted;
  do {
    deleted = await channel.bulkDelete(100, true);
  } while (deleted.size > 0);
}
