import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { controllableQueue, statusEmbed } from '../lib/music.js';

export const category = 'Music Player';
export const feature = 'music';

export const data = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('Você interrompe a reprodução e limpa a fila')
  .setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const queue = await controllableQueue(interaction);
  if (!queue) return;

  queue.destroy();
  await interaction.reply({
    embeds: [statusEmbed('Fim da Reprodução', `A reprodução foi interrompida por ${interaction.user}`, config.images.music.stop)],
  });
}
