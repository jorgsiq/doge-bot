import { ChannelType, EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { createQueue, formatDuration, getQueue, trackEmbed } from '../lib/music.js';
import { deferResult, finishResult } from '../lib/results.js';
import { getSpotifyList, parseSpotifyLink } from '../lib/spotify.js';
import { getPlaylist, resolveTrack, searchTracks } from '../lib/tracks.js';

export const category = 'Music Player';
export const feature = 'music';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Você coloca uma música na fila')
  .setContexts(InteractionContextType.Guild)
  .addStringOption((option) =>
    option
      // option names can't have slashes or spaces
      .setName('música-ou-playlist')
      .setDescription('Nome da música ou do artista, ou o link de uma playlist, álbum ou música do Spotify')
      .setRequired(true)
      // shared Spotify links carry tracking parameters
      .setMaxLength(200)
      .setAutocomplete(true),
  );

// Discord drops autocomplete answers after 3 seconds, so a slow search is cancelled and gives no suggestions;
// the race is a backstop in case some step of a search doesn't honor the signal
function searchForAutocomplete(query) {
  const search = searchTracks(query, 10, AbortSignal.timeout(2_000));
  return Promise.race([search, new Promise((resolve) => setTimeout(resolve, 2_500, []))]).catch(() => []);
}

const listTypes = {
  playlist: { name: 'Playlist', added: 'Playlist adicionada à fila' },
  album: { name: 'Álbum', added: 'Álbum adicionado à fila' },
};

// a pasted link becomes a single suggestion naming what it plays, as the short spotify:<type>:<id> URI
async function spotifySuggestion(link) {
  const list = await getSpotifyList(link, AbortSignal.timeout(2_000)).catch(() => null);
  const [track] = list?.tracks ?? [];
  const name = !list
    ? 'Link do Spotify'
    : link.type === 'track'
      ? `${track.title} — ${track.artist} (${formatDuration(track.duration)})`
      : `${listTypes[link.type].name}: ${list.name} (${list.tracks.length} músicas)`;
  return [{ name: name.slice(0, 100), value: `spotify:${link.type}:${link.id}` }];
}

export async function autocomplete(interaction) {
  const query = interaction.options.getFocused().trim();
  const link = parseSpotifyLink(query);
  if (link) return interaction.respond(await spotifySuggestion(link));
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

  // the answer, and every announcement of the queue it starts, go to the music channel picked in /setup, if any
  const result = await deferResult(interaction, 'musicChannel');

  const input = interaction.options.getString('música-ou-playlist', true);
  const link = parseSpotifyLink(input);
  // a Spotify track link plays like a search; playlists and albums come with all their tracks
  const isList = link && link.type !== 'track';

  let found;
  try {
    found = isList ? await getPlaylist(link) : await resolveTrack(input);
  } catch (error) {
    // the lookup itself failed (say, YouTube refusing the server), not a search that came up empty
    console.error('Failed to find a track:', error);
    return interaction.editReply('Desculpe! o serviço de música está temporariamente indisponível..');
  }
  if (isList && !found?.tracks.length) {
    return interaction.editReply('Desculpe! não encontrei músicas nesse link do Spotify, confira se a playlist é pública..');
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
      queue = await createQueue(voiceChannel, result.channel);
    } catch (error) {
      // timed out, or stopped (by /stop or everyone leaving) while connecting
      console.error('Failed to join the voice channel:', error);
      return interaction.editReply('Desculpe! não consegui entrar no canal de voz..');
    }
  }

  if (isList) {
    const tracks = found.tracks.map((track) => ({ ...track, requestedBy: interaction.user }));
    const startedNow = queue.add(...tracks);
    const done = `**${found.name}** ${startedNow ? 'começou a tocar' : 'entrou na fila'}, com ${tracks.length} músicas!`;
    return finishResult(interaction, result, { embeds: [listEmbed(found, listTypes[link.type], startedNow, interaction.user)] }, { done });
  }

  const track = { ...found, requestedBy: interaction.user };
  const startedNow = queue.add(track);

  await finishResult(interaction, result, {
    embeds: [
      startedNow
        ? trackEmbed(track, 'Tocando Agora', { largeCover: true })
        : trackEmbed(track, `Adicionado à fila (#${queue.tracks.length})`),
    ],
  }, { done: `**${track.title}** ${startedNow ? 'começou a tocar' : `entrou na fila (#${queue.tracks.length})`}!` });
}

function listEmbed(list, type, startedNow, user) {
  const duration = list.tracks.reduce((total, track) => total + track.duration, 0);
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setAuthor({ name: startedNow ? 'Tocando Agora' : type.added })
    .setTitle(list.name.slice(0, 256))
    .setURL(list.url)
    .setDescription('Para embaralhar a ordem utilize o comando **/shuffle**.')
    .addFields(
      { name: 'Músicas', value: String(list.tracks.length), inline: true },
      { name: 'Duração', value: formatDuration(duration), inline: true },
    )
    .setFooter({ text: `Pedido por @${user.username} · Spotify` });
  if (list.artwork) embed.setThumbnail(list.artwork);
  return embed;
}
