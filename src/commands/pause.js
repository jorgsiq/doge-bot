import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { describe } from '../lib/i18n.js';
import { controllableQueue, statusEmbed } from '../lib/music.js';
import { ephemeral } from '../lib/replies.js';
import { replyResult } from '../lib/results.js';
import { guildT } from '../lib/settings.js';

export const category = 'music';
export const feature = 'music';

export const data = describe(new SlashCommandBuilder().setName('pause'), 'pause').setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const queue = await controllableQueue(interaction);
  if (!queue) return;

  const t = guildT(interaction.guildId);
  if (queue.paused) return interaction.reply(ephemeral(t('pause.alreadyPaused')));
  if (!queue.pause()) return interaction.reply(ephemeral(t('pause.loading')));

  await replyResult(
    interaction,
    'musicChannel',
    { embeds: [statusEmbed(t('pause.title'), t('pause.message', { user: interaction.user }), config.images.music.pause)] },
    { done: t('pause.done') },
  );
}
