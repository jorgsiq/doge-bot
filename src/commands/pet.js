import { EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { describe } from '../lib/i18n.js';
import { interactionMessage } from '../lib/reactions.js';
import { replyResult } from '../lib/results.js';
import { guildT } from '../lib/settings.js';

export const category = 'fun';
export const feature = 'fun';

export const data = describe(new SlashCommandBuilder().setName('pet'), 'pet').setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const t = guildT(interaction.guildId);
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setDescription(t('pet.text', { user: interaction.user }))
    .setImage(config.images.pet);
  const message = interactionMessage(embed, { emoji: '🐶', mentioned: [interaction.user], notified: [] });
  await replyResult(interaction, 'funChannel', message, { done: t('pet.done') });
}
