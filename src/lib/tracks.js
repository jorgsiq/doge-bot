import * as audius from './audius.js';
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

// Resolves a reference picked from autocomplete, or searches whatever the member typed
export async function resolveTrack(input) {
  const [prefix, id] = input.split(':');
  if (sources[prefix] && id) return sources[prefix].get(id);
  return (await searchTracks(input, 1))[0] ?? null;
}
