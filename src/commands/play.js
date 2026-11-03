import { ChannelType, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { createQueue, formatDuration, getQueue, trackEmbed } from '../lib/music.js';
import { resolveTrack, searchTracks } from '../lib/tracks.js';

export const category = 'Music Player';
export const feature = 'music';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Você coloca uma música na fila')
  .setContexts(InteractionContextType.Guild)
  .addStringOption((option) =>
    option
      .setName('musica')
      .setDescription('Nome da música ou do artista')
      .setRequired(true)
      .setMaxLength(100)
      .setAutocomplete(true),
  );

// Discord drops autocomplete answers after 3 seconds, so a slow search is cancelled and gives no suggestions;
// the race is a backstop in case some step of a search doesn't honor the signal
function searchForAutocomplete(query) {
  const search = searchTracks(query, 10, AbortSignal.timeout(2_000));
  return Promise.race([search, new Promise((resolve) => setTimeout(resolve, 2_500, []))]).catch(() => []);
}

export async function autocomplete(interaction) {
  const query = interaction.options.getFocused().trim();
  const tracks = query ? await searchForAutocomplete(query) : [];

  await interaction.respond(
    tracks.map((track) => ({
      name: `${track.title} — ${track.artist} (${formatDuration(track.duration)})`.slice(0, 100),
      // the chosen value comes back to execute as a reference to this exact track
      value: track.ref,
    })),
  );
}

export async function execute(interaction) {
  const voiceChannel = interaction.member.voice.channel;
  if (!voiceChannel) {
    return interaction.reply({ content: 'Ei! você precisa estar em um canal de voz para tocar música..', flags: MessageFlags.Ephemeral });
  }
  if (voiceChannel.type !== ChannelType.GuildVoice) {
    return interaction.reply({ content: 'Desculpe! só consigo tocar em canais de voz comuns, não em palcos..', flags: MessageFlags.Ephemeral });
  }
  if (!voiceChannel.joinable || !voiceChannel.speakable) {
    return interaction.reply({ content: `Desculpe! não tenho permissão para tocar em ${voiceChannel}..`, flags: MessageFlags.Ephemeral });
  }

  const playingElsewhere = (queue) => queue && queue.channelId !== voiceChannel.id;
  const current = getQueue(interaction.guildId);
  if (playingElsewhere(current)) {
    return interaction.reply({ content: `Opa! já estou tocando em <#${current.channelId}>..`, flags: MessageFlags.Ephemeral });
  }

  await interaction.deferReply();

  let found;
  try {
    found = await resolveTrack(interaction.options.getString('musica', true));
  } catch (error) {
    // the lookup itself failed (say, YouTube refusing the server), not a search that came up empty
    console.error('Failed to find a track:', error);
    return interaction.editReply('Desculpe! o serviço de música está temporariamente indisponível..');
  }
  if (!found) {
    return interaction.editReply('Desculpe! não consegui encontrar a música que você pediu..');
  }

  // looked up again: another /play may have started (or /stop ended) the queue during the search
  const existing = getQueue(interaction.guildId);
  if (playingElsewhere(existing)) {
    return interaction.editReply(`Opa! já estou tocando em <#${existing.channelId}>..`);
  }

  let queue = existing;
  if (!queue) {
    try {
      queue = await createQueue(voiceChannel, interaction.channel);
    } catch (error) {
      // timed out, or stopped (by /stop or everyone leaving) while connecting
      console.error('Failed to join the voice channel:', error);
      return interaction.editReply('Desculpe! não consegui entrar no canal de voz..');
    }
  }

  const track = { ...found, requestedBy: interaction.user };
  const startedNow = queue.add(track);

  await interaction.editReply({
    embeds: [
      startedNow
        ? trackEmbed(track, 'Tocando Agora', { largeCover: true })
        : trackEmbed(track, `Adicionado à Fila (#${queue.tracks.length})`),
    ],
  });
}
