import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { describe } from '../lib/i18n.js';
import { controllableQueue, statusEmbed } from '../lib/music.js';
import { ephemeral } from '../lib/replies.js';
import { replyResult } from '../lib/results.js';
import { guildT } from '../lib/settings.js';

export const category = 'music';
export const feature = 'music';

export const data = describe(new SlashCommandBuilder().setName('resume'), 'resume').setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const queue = await controllableQueue(interaction);
  if (!queue) return;

  const t = guildT(interaction.guildId);
  if (!queue.paused) return interaction.reply(ephemeral(t('resume.notPaused')));

  queue.resume();
  await replyResult(
    interaction,
    'musicChannel',
    { embeds: [statusEmbed(t('resume.title'), t('resume.message', { user: interaction.user }), config.images.music.resume)] },
    { done: t('resume.done') },
  );
}
