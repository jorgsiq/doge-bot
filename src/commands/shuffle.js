import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { controllableQueue, statusEmbed } from '../lib/music.js';
import { replyResult } from '../lib/results.js';

export const category = 'Music Player';
export const feature = 'music';

export const data = new SlashCommandBuilder()
  .setName('shuffle')
  .setDescription('Você embaralha a ordem das músicas da fila')
  .setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const queue = await controllableQueue(interaction);
  if (!queue) return;

  if (queue.tracks.length < 2) {
    return interaction.reply({ content: 'Opa! a fila precisa de pelo menos 2 músicas para embaralhar..', flags: MessageFlags.Ephemeral });
  }
  queue.shuffle();
  await replyResult(interaction, 'musicChannel', {
    embeds: [
      statusEmbed('Fila Embaralhada', `${interaction.user} embaralhou as **${queue.tracks.length}** músicas da fila`, config.images.music.shuffle),
    ],
  }, { done: `As ${queue.tracks.length} músicas da fila foram embaralhadas!` });
}
