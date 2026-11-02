import { Events } from 'discord.js';
import { getSetting, isEnabled } from '../lib/settings.js';

export const name = Events.MessageCreate;

// The commands channel only keeps commands. Slash commands leave no message of the member's own, so anything a person
// types there goes, staff and owner included; only bots stay (this one's replies and other bots').
export async function execute(message) {
  if (message.author.bot || message.webhookId || message.system || !message.inGuild()) return;
  if (!isEnabled(message.guildId, 'commandsOnly') || message.channelId !== getSetting(message.guildId, 'commandsChannel')) return;

  await message.delete();
  const warning = await message.channel.send({
    content: `${message.author}, este canal é só para comandos: digite **/** para ver o que dá para fazer..`,
    allowedMentions: { parse: [] },
  });
  setTimeout(() => warning.delete().catch(() => {}), 10_000);
}
