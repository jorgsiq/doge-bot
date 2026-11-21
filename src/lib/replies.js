import { MessageFlags } from 'discord.js';

export const ephemeral = (payload) => ({
  ...(typeof payload === 'string' ? { content: payload } : payload),
  flags: MessageFlags.Ephemeral,
});
