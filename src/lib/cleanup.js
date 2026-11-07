import { EmbedBuilder } from 'discord.js';
import config from '../config.js';
import { everyDayAt } from './schedule.js';
import { getSetting, isEnabled } from './settings.js';

// 06:00 in Brasília (UTC-3, no daylight saving time since 2019)
const CLEANUP_HOUR_UTC = 9;

export function scheduleDailyCleanup(client) {
  // at most an hour late: a bot back later must not wipe the day's conversation
  everyDayAt('cleanup', CLEANUP_HOUR_UTC, 1, () => runCleanup(client));
}

async function runCleanup(client) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle('Novinho em Folha!')
    .setImage(config.images.clean)
    .setDescription(
      'Por segurança e privacidade as mensagens deste canal de texto foram apagadas permanentemente, tenha atenção que esta limpeza acontece diariamente às **06:00 (BRA)** neste canal!',
    )
    .setFooter({ text: 'Limpeza Concluída' })
    .setTimestamp();

  // read on every run, so changes made in /setup apply from the next cleanup on
  const channelIds = [...client.guilds.cache.values()]
    .filter((guild) => isEnabled(guild.id, 'cleanup'))
    .flatMap((guild) => getSetting(guild.id, 'cleanupChannels'));

  for (const channelId of channelIds) {
    try {
      const channel = await client.channels.fetch(channelId);
      await clearChannel(channel);
      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(`Failed to clean channel ${channelId}:`, error);
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
