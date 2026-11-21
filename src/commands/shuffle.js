import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { describe } from '../lib/i18n.js';
import { controllableQueue, statusEmbed } from '../lib/music.js';
import { ephemeral } from '../lib/replies.js';
import { replyResult } from '../lib/results.js';
import { guildT } from '../lib/settings.js';

export const category = 'music';
export const feature = 'music';

export const data = describe(new SlashCommandBuilder().setName('shuffle'), 'shuffle').setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const queue = await controllableQueue(interaction);
  if (!queue) return;

  const t = guildT(interaction.guildId);
  const count = queue.tracks.length;
  if (count < 2) return interaction.reply(ephemeral(t('shuffle.tooShort')));

  queue.shuffle();
  await replyResult(
    interaction,
    'musicChannel',
    { embeds: [statusEmbed(t('shuffle.title'), t('shuffle.message', { user: interaction.user, count }), config.images.music.shuffle)] },
    { done: t('shuffle.done', { count }) },
  );
}
