import { Quality, SearchType, Ytdl } from '@distube/ytdl-core';

// One session for the bot, created on first use so .env is loaded; YOUTUBE_COOKIE gets past "not a bot" checks on datacenters
let session;
const yt = () => (session ??= new Ytdl({ cookie: process.env.YOUTUBE_COOKIE || undefined }));

const AUDIO_ONLY = { quality: Quality.HighestAudio, filter: { hasAudio: true, hasVideo: false } };

// Search results have the square album cover; video info only has 16:9 thumbnails, so covers seen in searches are kept
const COVER_SIZE = /=w\d+-h\d+/;
const covers = new Map();
const MAX_COVERS = 1000;
const details = new Map();

function cover(thumbnails) {
  const url = thumbnails?.at(-1)?.url;
  return url && COVER_SIZE.test(url) ? url.replace(COVER_SIZE, '=w544-h544') : undefined;
}

function rememberCover(id, url) {
  if (!url) return;
  covers.delete(id);
  covers.set(id, url);
  if (covers.size > MAX_COVERS) covers.delete(covers.keys().next().value);
}

function toTrack({ id, title, author, lengthSeconds, thumbnails }, source = id) {
  return {
    id,
    title,
    // official audio uploads come from "<artist> - Topic" channels; empty when unknown, the embeds say so
    artist: author?.name?.replace(/ - Topic$/, '') ?? '',
    duration: Number(lengthSeconds),
    url: `https://music.youtube.com/watch?v=${id}`,
    artwork: cover(thumbnails) ?? covers.get(id) ?? thumbnails?.at(-1)?.url,
    source: 'YouTube Music',
    createStream: () => yt().download(source, AUDIO_ONLY),
  };
}

export async function searchSongs(query, limit = 10, signal) {
  const results = await yt().search(query, { type: SearchType.Song, limit, signal });
  const songs = results.filter((result) => !result.isLive && result.lengthSeconds);
  for (const song of songs) {
    rememberCover(song.id, cover(song.thumbnails));
    details.set(song.id, { title: song.title, artist: song.author?.name, duration: song.lengthSeconds });
    if (details.size > MAX_COVERS) details.delete(details.keys().next().value);
  }
  return songs.map((song) => toTrack(song));
}

export async function getSong(id) {
  const info = await yt().getInfo(id);
  // Without the video details (say, a half-trusted cookie) the audio still plays, so the searched info is used, or a placeholder if never searched
  const { title, author, lengthSeconds } = info.videoDetails;
  const known = details.get(id);
  if (!title) console.warn(`YouTube answered ${id} through the ${info.client} client without the video details`);
  return toTrack(
    {
      id,
      ...info.videoDetails,
      title: title || known?.title || 'YouTube Music',
      author: author?.name ? author : { name: known?.artist },
      lengthSeconds: Number(lengthSeconds) ? lengthSeconds : (known?.duration ?? 0),
    },
    info,
  );
}
