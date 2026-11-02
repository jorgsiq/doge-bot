import { Quality, SearchType, Ytdl } from '@distube/ytdl-core';

// one session for the whole bot: it keeps YouTube's visitor data and PO tokens
const yt = new Ytdl();

const AUDIO_ONLY = { quality: Quality.HighestAudio, filter: { hasAudio: true, hasVideo: false } };

// Search results carry the square album cover, at 120px with the size to render in its URL. The video info of a song
// picked from autocomplete only has 16:9 thumbnails (the cover between two bars), so covers seen in searches are kept.
const COVER_SIZE = /=w\d+-h\d+/;
const covers = new Map();
const MAX_COVERS = 1000;

function cover(thumbnails) {
  const url = thumbnails?.at(-1)?.url;
  return url && COVER_SIZE.test(url) ? url.replace(COVER_SIZE, '=w544-h544') : undefined;
}

function rememberCover(id, url) {
  if (!url) return;
  // oldest first, so the map drops what was searched longest ago
  covers.delete(id);
  covers.set(id, url);
  if (covers.size > MAX_COVERS) covers.delete(covers.keys().next().value);
}

function toTrack({ id, title, author, lengthSeconds, thumbnails }, source = id) {
  return {
    id,
    title,
    // official audio uploads come from "<artist> - Topic" channels
    artist: author?.name?.replace(/ - Topic$/, '') ?? 'Desconhecido',
    duration: Number(lengthSeconds),
    url: `https://music.youtube.com/watch?v=${id}`,
    // the 16:9 thumbnail only when the song never showed up in a search (say, picked right before a restart)
    artwork: cover(thumbnails) ?? covers.get(id) ?? thumbnails?.at(-1)?.url,
    source: 'YouTube Music',
    createStream: () => yt.download(source, AUDIO_ONLY),
  };
}

// YouTube Music "songs" are the official studio recordings, not music videos
export async function searchSongs(query, limit = 10, signal) {
  const results = await yt.search(query, { type: SearchType.Song, limit, signal });
  const songs = results.filter((result) => !result.isLive && result.lengthSeconds);
  for (const song of songs) rememberCover(song.id, cover(song.thumbnails));
  return songs.map((song) => toTrack(song));
}

export async function getSong(id) {
  const info = await yt.getInfo(id);
  // reusing the info saves a second lookup when the track starts soon
  return toTrack({ id, ...info.videoDetails }, info);
}
