import { EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { replyResult } from '../lib/results.js';

export const category = 'Fun';
export const feature = 'fun';

export const data = new SlashCommandBuilder()
  .setName('pet')
  .setDescription('Você faz carinho no Đoge')
  .setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  // the text goes above the embed, like the other interactions; the member who did it needs no notification
  await replyResult(interaction, 'funChannel', {
    content: `${interaction.user} fez carinho no Đoge!\nWoof woof. Abana o rabinho!`,
    embeds: [new EmbedBuilder().setColor(config.colors.doge).setImage(config.images.pet)],
    allowedMentions: { users: [] },
  });
}
