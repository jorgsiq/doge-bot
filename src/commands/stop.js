import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { describe } from '../lib/i18n.js';
import { controllableQueue, statusEmbed } from '../lib/music.js';
import { replyResult } from '../lib/results.js';
import { guildT } from '../lib/settings.js';

export const category = 'music';
export const feature = 'music';

export const data = describe(new SlashCommandBuilder().setName('stop'), 'stop').setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const queue = await controllableQueue(interaction);
  if (!queue) return;

  const t = guildT(interaction.guildId);
  queue.destroy();
  await replyResult(
    interaction,
    'musicChannel',
    { embeds: [statusEmbed(t('music.playbackEnded'), t('stop.message', { user: interaction.user }), config.images.music.stop)] },
    { done: t('stop.done') },
  );
}
