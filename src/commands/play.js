import { ChannelType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { describe, localize } from '../lib/i18n.js';
import { artistName, createQueue, formatDuration, getQueue, trackEmbed } from '../lib/music.js';
import { ephemeral } from '../lib/replies.js';
import { deferResult, finishResult } from '../lib/results.js';
import { guildT } from '../lib/settings.js';
import { getSpotifyList, parseSpotifyLink } from '../lib/spotify.js';
import { getPlaylist, resolveTrack, searchTracks } from '../lib/tracks.js';

export const category = 'music';
export const feature = 'music';

export const data = describe(new SlashCommandBuilder().setName('play'), 'play')
  .setContexts(InteractionContextType.Guild)
  .addStringOption((option) => localize(option, 'play.options.song').setRequired(true).setMaxLength(200).setAutocomplete(true));

// Discord drops autocomplete answers after 3 seconds, so a slow search is cancelled; the race is a backstop for steps that ignore the signal
function searchForAutocomplete(query) {
  const search = searchTracks(query, 10, AbortSignal.timeout(2_000));
  return Promise.race([search, new Promise((resolve) => setTimeout(resolve, 2_500, []))]).catch(() => []);
}

function suggestionName(t, link, list) {
  if (!list) return t('play.suggestions.link');
  if (link.type === 'track') {
    const [track] = list.tracks;
    return t('play.suggestions.track', { title: track.title, artist: track.artist, duration: formatDuration(track.duration) });
  }
  return t('play.suggestions.list', {
    type: t(`play.types.${link.type}.name`),
    name: list.name,
    songs: t('play.songs', { count: list.tracks.length }),
  });
}

async function spotifySuggestion(t, link) {
  const list = await getSpotifyList(link, AbortSignal.timeout(2_000)).catch(() => null);
  const name = suggestionName(t, link, list);
  return [{ name: name.slice(0, 100), value: `spotify:${link.type}:${link.id}` }];
}

export async function autocomplete(interaction) {
  const t = guildT(interaction.guildId);
  const query = interaction.options.getFocused().trim();
  const link = parseSpotifyLink(query);
  if (link) return interaction.respond(await spotifySuggestion(t, link));
  const tracks = query ? await searchForAutocomplete(query) : [];

  await interaction.respond(
    tracks.map((track) => ({
      name: t('play.suggestions.track', {
        title: track.title,
        artist: artistName(t, track),
        duration: formatDuration(track.duration),
      }).slice(0, 100),
      value: track.ref,
    })),
  );
}

export async function execute(interaction) {
  const t = guildT(interaction.guildId);
  const voiceChannel = interaction.member.voice.channel;
  if (!voiceChannel) return interaction.reply(ephemeral(t('play.errors.noVoice')));
  if (voiceChannel.type !== ChannelType.GuildVoice) return interaction.reply(ephemeral(t('play.errors.stage')));
  if (!voiceChannel.joinable || !voiceChannel.speakable) {
    return interaction.reply(ephemeral(t('play.errors.noPermission', { channel: voiceChannel })));
  }

  const playingElsewhere = (queue) => queue && queue.channelId !== voiceChannel.id;
  const current = getQueue(interaction.guildId);
  if (playingElsewhere(current)) return interaction.reply(ephemeral(t('play.errors.elsewhere', { channel: current.channelId })));

  const result = await deferResult(interaction, 'musicChannel');

  const input = interaction.options.getString('song-or-playlist', true);
  const link = parseSpotifyLink(input);
  const isList = link && link.type !== 'track';

  let found;
  try {
    found = isList ? await getPlaylist(link) : await resolveTrack(input);
  } catch (error) {
    console.error('Failed to find a track:', error);
    return interaction.editReply(t('play.errors.unavailable'));
  }
  if (isList && !found?.tracks.length) return interaction.editReply(t('play.errors.emptyList'));
  if (!found) return interaction.editReply(t('play.errors.notFound'));

  // looked up again: another /play may have started (or /stop ended) the queue during the search
  const existing = getQueue(interaction.guildId);
  if (playingElsewhere(existing)) return interaction.editReply(t('play.errors.elsewhere', { channel: existing.channelId }));

  let queue = existing;
  if (!queue) {
    try {
      queue = await createQueue(voiceChannel, result.channel);
    } catch (error) {
      console.error('Failed to join the voice channel:', error);
      return interaction.editReply(t('play.errors.cannotJoin'));
    }
  }

  if (isList) {
    const tracks = found.tracks.map((track) => ({ ...track, requestedBy: interaction.user }));
    const startedNow = queue.add(...tracks);
    const done = t(startedNow ? 'play.list.started' : 'play.list.queued', {
      name: found.name,
      songs: t('play.songs', { count: tracks.length }),
    });
    return finishResult(interaction, result, { embeds: [listEmbed(t, found, link.type, startedNow, interaction.user)] }, { done });
  }

  const track = { ...found, requestedBy: interaction.user };
  const startedNow = queue.add(track);
  const position = queue.tracks.length;

  let embed;
  if (startedNow) embed = trackEmbed(t, track, t('music.nowPlaying'), { largeCover: true });
  else embed = trackEmbed(t, track, t('play.track.queuedTitle', { position }));

  await finishResult(
    interaction,
    result,
    { embeds: [embed] },
    { done: t(startedNow ? 'play.track.started' : 'play.track.queued', { title: track.title, position }) },
  );
}

function listEmbed(t, list, type, startedNow, user) {
  const duration = list.tracks.reduce((total, track) => total + track.duration, 0);
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setAuthor({ name: startedNow ? t('music.nowPlaying') : t(`play.types.${type}.added`) })
    .setTitle(list.name.slice(0, 256))
    .setURL(list.url)
    .setDescription(t('play.list.description'))
    .addFields(
      { name: t('play.list.songs'), value: String(list.tracks.length), inline: true },
      { name: t('play.list.duration'), value: formatDuration(duration), inline: true },
    )
    .setFooter({ text: t('music.requestedBy', { user: user.username, source: 'Spotify' }) });
  if (list.artwork) embed.setThumbnail(list.artwork);
  return embed;
}
