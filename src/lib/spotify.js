// Spotify's API needs a registered app, but its embed player (the page sites show in an iframe) carries the title,
// artist and duration of the first 100 tracks of any public playlist or album, with no credentials
const EMBED = 'https://open.spotify.com/embed';

// open.spotify.com/(intl-pt/)playlist/<id>?si=..., or the spotify:playlist:<id> URI the desktop app copies
const LINK = /^(?:https?:\/\/open\.spotify\.com\/(?:intl-[\w-]+\/)?|spotify:)(playlist|album|track)[/:]([A-Za-z0-9]{22})(?![A-Za-z0-9])/;

export function parseSpotifyLink(input) {
  const match = input.trim().match(LINK);
  return match && { type: match[1], id: match[2] };
}

const trackUrl = (uri) => `https://open.spotify.com/track/${uri.split(':').at(-1)}`;

// Returns { name, url, artwork, tracks }, or null when the link leads nowhere (private or removed)
export async function getSpotifyList({ type, id }, signal) {
  const timeout = AbortSignal.timeout(5_000);
  const response = await fetch(`${EMBED}/${type}/${id}`, { signal: signal ? AbortSignal.any([timeout, signal]) : timeout });
  if (!response.ok) throw new Error(`Spotify responded with ${response.status}`);

  const data = (await response.text()).match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)?.[1];
  if (!data) throw new Error('Spotify changed its embed page');
  // a missing list still answers 200, with a "Page not found" page and no entity
  const entity = JSON.parse(data).props?.pageProps?.state?.data?.entity;
  if (!entity) return null;

  const tracks =
    type === 'track'
      ? [{ title: entity.name, artist: entity.artists.map((artist) => artist.name).join(', '), duration: entity.duration, uri: entity.uri }]
      : // playlists may mix in podcast episodes, which aren't on YouTube Music
        entity.trackList.filter((item) => item.entityType === 'track').map((item) => ({ ...item, artist: item.subtitle }));

  return {
    name: entity.name,
    url: `https://open.spotify.com/${type}/${id}`,
    artwork: entity.visualIdentity?.image?.toSorted((a, b) => b.maxWidth - a.maxWidth)[0]?.url,
    tracks: tracks.map(({ title, artist, duration, uri }) => ({
      title,
      artist,
      duration: Math.round(duration / 1000),
      url: trackUrl(uri),
    })),
  };
}
