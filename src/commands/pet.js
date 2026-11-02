import { EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';

export const category = 'Fun';

export const data = new SlashCommandBuilder()
  .setName('pet')
  .setDescription('Você faz carinho no Đoge')
  .setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setDescription(`${interaction.user} fez carinho no Đoge! Woof woof,\nabana o rabinho!`)
    .setImage(config.images.pet);
  await interaction.reply({ embeds: [embed] });
}
