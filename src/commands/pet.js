import { EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { interactionMessage } from '../lib/reactions.js';
import { replyResult } from '../lib/results.js';

export const category = 'Fun';
export const feature = 'fun';

export const data = new SlashCommandBuilder()
  .setName('pet')
  .setDescription('Você faz carinho no Đoge')
  .setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setDescription(`${interaction.user} fez carinho no Đoge!\nWoof woof. Abana o rabinho!`)
    .setImage(config.images.pet);
  // mentioned like in the other interactions, but the member who did it needs no notification
  await replyResult(interaction, 'funChannel', interactionMessage(embed, [interaction.user], []));
}
