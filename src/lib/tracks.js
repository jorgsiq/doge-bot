import * as audius from './audius.js';
import { getSpotifyList, parseSpotifyLink } from './spotify.js';
import * as youtube from './youtube.js';

// track references look like "<source>:<id>", e.g. "yt:qu1_lRJ-hPA"
const sources = {
  yt: { search: youtube.searchSongs, get: youtube.getSong },
  audius: { search: audius.searchTracks, get: audius.getTrack },
};

const trackRef = (prefix, track) => `${prefix}:${track.id}`;

// YouTube Music first; Audius only when YouTube is failing or finds nothing. `signal` cancels both.
export async function searchTracks(query, limit = 10, signal) {
  try {
    const songs = await sources.yt.search(query, limit, signal);
    if (songs.length) return songs.map((track) => ({ ...track, ref: trackRef('yt', track) }));
  } catch (error) {
    // cancelled, not failing: no point in trying Audius
    if (signal?.aborted) throw error;
    console.error('YouTube search failed, falling back to Audius:', error.message);
  }
  const tracks = await sources.audius.search(query, limit, signal);
  return tracks.map((track) => ({ ...track, ref: trackRef('audius', track) }));
}

// Resolves a reference picked from autocomplete, a Spotify track link, or searches whatever the member typed
export async function resolveTrack(input) {
  const link = parseSpotifyLink(input);
  if (link) {
    const list = await getSpotifyList(link);
    return list?.tracks.length ? findRecording(list.tracks[0]) : null;
  }
  const [prefix, id] = input.split(':');
  if (sources[prefix] && id) return sources[prefix].get(id);
  return (await searchTracks(input, 1))[0] ?? null;
}

// Search results for a song usually start with its official recording, but an extended mix, a live take or a cover
// can come first too, so the first one about as long as the Spotify track is the one played
const SAME_LENGTH = 10;

export function pickRecording(songs, duration) {
  return songs.find((song) => Math.abs(song.duration - duration) <= SAME_LENGTH) ?? songs[0] ?? null;
}

// YouTube only: Audius rarely has a mainstream song, and would play some other one with a similar name
async function findRecording({ title, artist, duration }) {
  return pickRecording(await youtube.searchSongs(`${artist} ${title}`, 5), duration);
}

// Spotify playlists and albums, with each track looking for its YouTube Music recording only when its turn comes,
// so even a long playlist starts right away. Returns null when the link leads nowhere.
export async function getPlaylist(link) {
  const list = await getSpotifyList(link);
  if (!list) return null;
  const tracks = list.tracks.map((track) => ({
    ...track,
    source: 'Spotify',
    async resolve() {
      const recording = await findRecording(track);
      if (!recording) throw new Error('Not found on YouTube Music');
      return recording;
    },
  }));
  return { ...list, tracks };
}
