import { Events } from 'discord.js';
import { getSetting, guildT, isEnabled } from '../lib/settings.js';

export const name = Events.MessageCreate;

// Slash commands leave no message of the member's own, so any message here goes, staff and owner included; only bots stay
export async function execute(message) {
  if (message.author.bot || message.webhookId || message.system || !message.inGuild()) return;
  if (!isEnabled(message.guildId, 'commandsOnly') || message.channelId !== getSetting(message.guildId, 'commandsChannel')) return;

  await message.delete();
  const warning = await message.channel.send({
    content: guildT(message.guildId)('messageCreate.warning', { user: message.author }),
    allowedMentions: { parse: [] },
  });
  setTimeout(() => warning.delete().catch(() => {}), 10_000);
}
