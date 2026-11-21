import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { describe } from '../lib/i18n.js';
import { artistName, formatDuration, getQueue, statusEmbed } from '../lib/music.js';
import { ephemeral } from '../lib/replies.js';
import { guildT } from '../lib/settings.js';

export const category = 'music';
export const feature = 'music';

const SHOWN = 10;

export const data = describe(new SlashCommandBuilder().setName('queue'), 'queue').setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const t = guildT(interaction.guildId);
  const queue = getQueue(interaction.guildId);
  if (!queue?.current) return interaction.reply(ephemeral(t('music.noQueue')));

  const line = (track) =>
    t('queue.line', {
      title: track.title,
      artist: artistName(t, track),
      duration: formatDuration(track.duration),
      user: track.requestedBy.username,
    });
  const lines = [
    `(${t(queue.paused ? 'queue.paused' : 'queue.playing')}) ${line(queue.current)}`,
    ...queue.tracks.slice(0, SHOWN).map((track, i) => `(${i + 1}) ${line(track)}`),
  ];
  if (queue.tracks.length > SHOWN) lines.push(t('queue.more', { count: queue.tracks.length - SHOWN }));

  await interaction.reply(
    ephemeral({
      embeds: [statusEmbed(t('queue.title'), `${t('queue.hint')}\n\n${lines.join('\n\n')}`, config.images.music.queue)],
    }),
  );
}
