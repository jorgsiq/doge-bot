// Audius is an open music platform whose public API allows streaming from third-party apps
const API = 'https://api.audius.co/v1';
const APP_NAME = 'doge-bot';

async function request(path, params = {}, signal) {
  const url = new URL(`${API}${path}`);
  url.search = new URLSearchParams({ ...params, app_name: APP_NAME });

  const timeout = AbortSignal.timeout(5_000);
  const response = await fetch(url, { signal: signal ? AbortSignal.any([timeout, signal]) : timeout });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Audius API responded with ${response.status}`);
  return (await response.json()).data;
}

// removed or gated tracks show up in search results but can't be streamed
const isPlayable = (track) => track.is_streamable && track.access?.stream;

function toTrack(track) {
  return {
    id: track.id,
    title: track.title,
    artist: track.user.name,
    duration: track.duration,
    url: `https://audius.co${track.permalink}`,
    artwork: track.artwork?.['480x480'],
    source: 'Audius',
    // FFmpeg opens this URL at play time, since the signed file URL it redirects to expires in minutes
    createStream: () => `${API}/tracks/${track.id}/stream?app_name=${APP_NAME}`,
  };
}

export async function searchTracks(query, limit = 10, signal) {
  const tracks = await request('/tracks/search', { query, limit: 25 }, signal);
  return (tracks ?? []).filter(isPlayable).slice(0, limit).map(toTrack);
}

export async function getTrack(id) {
  const track = await request(`/tracks/${encodeURIComponent(id)}`);
  return track && isPlayable(track) ? toTrack(track) : null;
}
