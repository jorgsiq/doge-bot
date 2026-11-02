import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { formatDuration, getQueue, statusEmbed } from '../lib/music.js';

export const category = 'Music Player';
export const feature = 'music';

const SHOWN = 10;

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('Você vê a lista de músicas em espera')
  .setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const queue = getQueue(interaction.guildId);
  if (!queue?.current) {
    return interaction.reply({ content: 'Opa! parece que não existe nenhuma música sendo reproduzida..', flags: MessageFlags.Ephemeral });
  }

  const line = (track) => `**${track.title}**, ${track.artist} (${formatDuration(track.duration)}) — @${track.requestedBy.username}`;
  const lines = [
    `(${queue.paused ? 'Pausada' : 'Reproduzindo'}) ${line(queue.current)}`,
    ...queue.tracks.slice(0, SHOWN).map((track, i) => `(${i + 1}) ${line(track)}`),
  ];
  if (queue.tracks.length > SHOWN) lines.push(`…e mais ${queue.tracks.length - SHOWN} músicas`);

  await interaction.reply({
    embeds: [
      statusEmbed(
        'Lista de Reprodução',
        `Para avançar para a próxima música utilize o comando **/skip**.\n\n${lines.join('\n\n')}`,
        config.images.music.queue,
      ),
    ],
    flags: MessageFlags.Ephemeral,
  });
}
