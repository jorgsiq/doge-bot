import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { controllableQueue, statusEmbed } from '../lib/music.js';
import { replyResult } from '../lib/results.js';

export const category = 'Music Player';
export const feature = 'music';

export const data = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('Você retoma a reprodução da música atual')
  .setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const queue = await controllableQueue(interaction);
  if (!queue) return;

  if (!queue.paused) {
    return interaction.reply({ content: 'Opa! a música não está pausada..', flags: MessageFlags.Ephemeral });
  }

  queue.resume();
  await replyResult(interaction, 'musicChannel', {
    embeds: [statusEmbed('Reproduzindo Música', `A trilha atual foi retomada por ${interaction.user}`, config.images.music.resume)],
  }, { done: 'A música voltou a tocar!' });
}
