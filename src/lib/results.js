import { MessageFlags } from 'discord.js';
import { getSetting } from './settings.js';

// Where a feature's public messages go: the channel picked for it in /setup, else the one the command was used in
// (null when the bot can't see that channel)
export function resultChannel(interaction, key) {
  return interaction.guild.channels.cache.get(getSetting(interaction.guildId, key)) ?? interaction.channel;
}

const sentTo = (channel) => `Pronto! a mensagem foi enviada em ${channel}`;
const cannotSendTo = (channel) => `Desculpe! não tenho permissão para enviar mensagens em ${channel}..`;

async function send(channel, payload) {
  try {
    return await channel.send(payload);
  } catch (error) {
    console.error(`Failed to send to #${channel.name}:`, error.message);
    return null;
  }
}

// For results that take a moment: answers "thinking..." (only to the member when the result goes elsewhere)
export async function deferResult(interaction, key) {
  const channel = resultChannel(interaction, key);
  const elsewhere = Boolean(channel) && channel.id !== interaction.channelId;
  await interaction.deferReply(elsewhere ? { flags: MessageFlags.Ephemeral } : {});
  return { channel, elsewhere };
}

// Shows a deferred result. Discord only notifies mentions in new messages, and a deferred reply is edited, never sent
// anew, so a result that `notify`s someone goes out as a new message and the "thinking..." reply is removed.
export async function finishResult(interaction, { channel, elsewhere }, payload, { notify = false } = {}) {
  if (elsewhere) {
    const sent = await send(channel, payload);
    return interaction.editReply(sent ? sentTo(channel) : cannotSendTo(channel));
  }
  // where the bot can't post on its own, the reply itself shows the result, just without notifying
  if (notify && channel && (await send(channel, payload))) return interaction.deleteReply();
  return interaction.editReply(payload);
}

// For results ready right away that notify no one: a plain reply, unless they belong in another channel
export async function replyResult(interaction, key, payload) {
  const channel = resultChannel(interaction, key);
  if (!channel || channel.id === interaction.channelId) return interaction.reply(payload);
  const sent = await send(channel, payload);
  return interaction.reply({ content: sent ? sentTo(channel) : cannotSendTo(channel), flags: MessageFlags.Ephemeral });
}
