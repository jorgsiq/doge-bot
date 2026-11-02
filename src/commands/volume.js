import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { controllableQueue, statusEmbed } from '../lib/music.js';

export const category = 'Music Player';
export const feature = 'music';

export const data = new SlashCommandBuilder()
  .setName('volume')
  .setDescription('Você ajusta o volume de reprodução')
  .setContexts(InteractionContextType.Guild)
  .addIntegerOption((option) =>
    option.setName('nivel').setDescription('Volume de 0 a 10').setRequired(true).setMinValue(0).setMaxValue(10),
  );

export async function execute(interaction) {
  const queue = await controllableQueue(interaction);
  if (!queue) return;

  const volume = interaction.options.getInteger('nivel', true);
  queue.setVolume(volume);
  await interaction.reply({
    embeds: [statusEmbed('Volume Ajustado', `${interaction.user} ajustou o volume para (**${volume}**/10)`, config.images.music.volume)],
  });
}
