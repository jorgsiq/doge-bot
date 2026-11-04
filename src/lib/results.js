import { MessageFlags } from 'discord.js';
import { getSetting } from './settings.js';

// Where a feature's public messages go: the channel picked for it in /setup, else the one the command was used in
// (null when the bot can't see that channel)
export function resultChannel(interaction, key) {
  return interaction.guild.channels.cache.get(getSetting(interaction.guildId, key)) ?? interaction.channel;
}

// What the member is told when the message went to another channel: `done`, what the command did, then where to look,
// or that the bot couldn't post there (its permissions, which only staff can fix)
const notices = {
  musicChannel: {
    sent: (channel) => `O status foi atualizado em ${channel}.`,
    failed: (channel) => `Não consegui atualizar o status do player em ${channel}... Por favor, comunique um administrador do servidor.`,
  },
  funChannel: {
    sent: (channel) => `Confira em ${channel}.`,
    failed: (channel) => `Não consegui enviar a interação em ${channel}... Por favor, comunique um administrador do servidor.`,
  },
};

function sentElsewhere(key, channel, sent, done) {
  return sent ? `${done} ${notices[key].sent(channel)}` : `${done}\n\n${notices[key].failed(channel)}`;
}

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
  return { key, channel, elsewhere };
}

// Shows a deferred result. Discord only notifies mentions in new messages, and a deferred reply is edited, never sent
// anew, so a result that `notify`s someone goes out as a new message and the "thinking..." reply is removed.
export async function finishResult(interaction, { key, channel, elsewhere }, payload, { done, notify = false }) {
  if (elsewhere) {
    const sent = await send(channel, payload);
    return interaction.editReply(sentElsewhere(key, channel, sent, done));
  }
  // where the bot can't post on its own, the reply itself shows the result, just without notifying
  if (notify && channel && (await send(channel, payload))) return interaction.deleteReply();
  return interaction.editReply(payload);
}

// For results ready right away that notify no one: a plain reply, unless they belong in another channel
export async function replyResult(interaction, key, payload, { done }) {
  const channel = resultChannel(interaction, key);
  if (!channel || channel.id === interaction.channelId) return interaction.reply(payload);
  const sent = await send(channel, payload);
  return interaction.reply({ content: sentElsewhere(key, channel, sent, done), flags: MessageFlags.Ephemeral });
}
