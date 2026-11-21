import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { describe } from '../lib/i18n.js';
import { controllableQueue, statusEmbed } from '../lib/music.js';
import { ephemeral } from '../lib/replies.js';
import { replyResult } from '../lib/results.js';
import { guildT } from '../lib/settings.js';

export const category = 'music';
export const feature = 'music';

export const data = describe(new SlashCommandBuilder().setName('skip'), 'skip').setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const queue = await controllableQueue(interaction);
  if (!queue) return;

  const t = guildT(interaction.guildId);
  const skipped = queue.current;
  if (!skipped) return interaction.reply(ephemeral(t('skip.notStarted')));

  queue.skip();
  await replyResult(
    interaction,
    'musicChannel',
    {
      embeds: [statusEmbed(t('skip.title'), t('skip.message', { user: interaction.user, title: skipped.title }), config.images.music.skip)],
    },
    { done: t('skip.done', { title: skipped.title }) },
  );
}
