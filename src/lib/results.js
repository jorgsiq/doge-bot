import { MessageFlags } from 'discord.js';
import { ephemeral } from './replies.js';
import { getSetting, guildT } from './settings.js';

export function resultChannel(interaction, key) {
  return interaction.guild.channels.cache.get(getSetting(interaction.guildId, key)) ?? interaction.channel;
}

function sentElsewhere(interaction, key, channel, sent, done) {
  const t = guildT(interaction.guildId);
  return sent ? `${done} ${t(`results.${key}.sent`, { channel })}` : `${done}\n\n${t(`results.${key}.failed`, { channel })}`;
}

async function send(channel, payload) {
  try {
    return await channel.send(payload);
  } catch (error) {
    console.error(`Failed to send to #${channel.name}:`, error.message);
    return null;
  }
}

export async function deferResult(interaction, key) {
  const channel = resultChannel(interaction, key);
  const elsewhere = Boolean(channel) && channel.id !== interaction.channelId;
  await interaction.deferReply(elsewhere ? { flags: MessageFlags.Ephemeral } : {});
  return { key, channel, elsewhere };
}

// Discord only notifies mentions in new messages, so a result that notifies someone is sent anew and the "thinking..." reply is removed
export async function finishResult(interaction, { key, channel, elsewhere }, payload, { done, notify = false }) {
  if (elsewhere) {
    const sent = await send(channel, payload);
    return interaction.editReply(sentElsewhere(interaction, key, channel, sent, done));
  }
  if (notify && channel && (await send(channel, payload))) return interaction.deleteReply();
  return interaction.editReply(payload);
}

export async function replyResult(interaction, key, payload, { done }) {
  const channel = resultChannel(interaction, key);
  if (!channel || channel.id === interaction.channelId) return interaction.reply(payload);
  const sent = await send(channel, payload);
  return interaction.reply(ephemeral(sentElsewhere(interaction, key, channel, sent, done)));
}
