import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { describe, localize } from '../lib/i18n.js';
import { controllableQueue, statusEmbed } from '../lib/music.js';
import { replyResult } from '../lib/results.js';
import { guildT } from '../lib/settings.js';

export const category = 'music';
export const feature = 'music';

export const data = describe(new SlashCommandBuilder().setName('volume'), 'volume')
  .setContexts(InteractionContextType.Guild)
  .addIntegerOption((option) => localize(option, 'volume.options.level').setRequired(true).setMinValue(0).setMaxValue(10));

export async function execute(interaction) {
  const queue = await controllableQueue(interaction);
  if (!queue) return;

  const t = guildT(interaction.guildId);
  const volume = interaction.options.getInteger('level', true);
  queue.setVolume(volume);
  await replyResult(
    interaction,
    'musicChannel',
    { embeds: [statusEmbed(t('volume.title'), t('volume.message', { user: interaction.user, volume }), config.images.music.volume)] },
    { done: t('volume.done', { volume }) },
  );
}
