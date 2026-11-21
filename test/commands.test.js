import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadCommands } from '../src/lib/commands.js';
import { canRepost } from '../src/lib/gameAlerts.js';
import { baseTitle, dealScore, isRelevantDeal, isReputableFreeGame, withoutDuplicateEditions } from '../src/lib/games.js';
import { formatDuration } from '../src/lib/music.js';
import { features, isEnabled, missingSettings } from '../src/lib/settings.js';
import { isDue, withRetries } from '../src/lib/schedule.js';
import { coupleName, firstName, shipScore } from '../src/lib/reactions.js';
import { isLandscape, unseenPhotos } from '../src/lib/shiba.js';
import { parseSpotifyLink } from '../src/lib/spotify.js';
import { pickRecording } from '../src/lib/tracks.js';

test('every command is valid for the Discord API', async () => {
  const commands = await loadCommands();
  assert.ok(commands.size > 0);

  for (const [name, command] of commands) {
    assert.equal(typeof command.execute, 'function', `${name} has no execute`);
    assert.ok(command.category, `${name} has no category`);
    assert.equal(command.data.toJSON().name, name);
  }
});

test('a daily task runs once from its UTC hour on, even if the bot was offline then', () => {
  const ranYesterday = Date.parse('2026-11-05T12:00:00Z');
  const ranToday = Date.parse('2026-11-06T12:00:00Z');
  const at = (iso) => new Date(iso);
  assert.ok(!isDue(12, 15, ranYesterday, at('2026-11-06T11:59:00Z')), 'not before its hour');
  assert.ok(isDue(12, 15, ranYesterday, at('2026-11-06T12:00:00Z')));
  assert.ok(isDue(12, 15, ranYesterday, at('2026-11-06T18:30:00Z')), 'the bot came back late');
  assert.ok(!isDue(12, 15, ranToday, at('2026-11-06T18:30:00Z')), 'it already ran today');
  assert.ok(isDue(12, 15, ranYesterday, at('2026-11-07T02:59:00Z')), 'still the same day in Brasília');
  assert.ok(!isDue(12, 15, ranYesterday, at('2026-11-07T03:00:00Z')), 'too late: the day is skipped');
  assert.ok(isDue(12, 15, undefined, at('2026-11-06T12:00:00Z')), 'a task that never ran');
});

test('a weekly task runs once from its weekday and UTC hour on', () => {
  const ranLastWeek = Date.parse('2026-11-13T21:00:00Z');
  const ranThisWeek = Date.parse('2026-11-20T21:00:00Z');
  const at = (iso) => new Date(iso);
  assert.ok(!isDue(21, 30, ranLastWeek, at('2026-11-19T21:00:00Z'), 5), 'not on Thursday');
  assert.ok(!isDue(21, 30, ranLastWeek, at('2026-11-20T20:59:00Z'), 5), 'not before its hour');
  assert.ok(isDue(21, 30, ranLastWeek, at('2026-11-20T21:00:00Z'), 5));
  assert.ok(isDue(21, 30, ranLastWeek, at('2026-11-22T02:59:00Z'), 5), 'still Saturday in Brasília');
  assert.ok(!isDue(21, 30, ranLastWeek, at('2026-11-22T03:00:00Z'), 5), 'too late: the week is skipped');
  assert.ok(!isDue(21, 30, ranThisWeek, at('2026-11-21T12:00:00Z'), 5), 'it already ran this week');
});

test('a game comes back only once the sale it was posted in has ended', () => {
  const postedAt = Date.parse('2026-11-20T21:00:00Z');
  const endsAt = Date.parse('2026-11-24T17:00:00Z');
  assert.ok(!canRepost({ at: postedAt, endsAt }, Date.parse('2026-11-24T16:59:00Z')), 'the same sale');
  assert.ok(canRepost({ at: postedAt, endsAt }, Date.parse('2026-11-27T21:00:00Z')), 'a new sale');
  assert.ok(canRepost({ at: postedAt, endsAt }, Date.parse('2027-11-26T21:00:00Z')), 'a sale a year later');
  assert.ok(!canRepost({ at: postedAt }, Date.parse('2026-12-19T21:00:00Z')), 'unknown end: not within 30 days');
  assert.ok(canRepost({ at: postedAt }, Date.parse('2026-12-20T21:00:00Z')), 'unknown end: after 30 days');
});

test('free games need a price and a reputation', () => {
  const free = (title, normalPrice, steamRatingPercent, steamRatingCount, metacriticScore) => ({
    title,
    normalPrice,
    steamRatingPercent,
    steamRatingCount,
    metacriticScore,
  });
  assert.ok(isReputableFreeGame(free("Sorry We're Closed", '24.99', '98', '1684', '83')));
  assert.ok(isReputableFreeGame(free('Only on GOG, well rated by critics', '19.99', '0', '0', '78')));
  assert.ok(!isReputableFreeGame(free('MAFIA HOTEL', '1.99', '0', '0', '0')));
  assert.ok(!isReputableFreeGame(free('Gladiator: Blades of Fury', '9.99', '0', '0', '0')));
  assert.ok(!isReputableFreeGame(free('Free-to-play', '0.00', '90', '50000', '0')));
});

test('deals need a big discount on a popular, well reviewed game', () => {
  const deal = (title, savings, steamRatingPercent, steamRatingCount) => ({
    title,
    savings,
    steamRatingPercent,
    steamRatingCount,
    steamAppID: '1',
  });
  assert.ok(isRelevantDeal(deal('LIMBO', '90.07', '91', '13172')));
  assert.ok(isRelevantDeal(deal('Slime Rancher', '75.00', '98', '66023')));
  assert.ok(!isRelevantDeal(deal('Lacuna, too few reviews', '90.06', '92', '735')));
  assert.ok(!isRelevantDeal(deal('Balatro, discount too small', '20.00', '98', '105457')));
  assert.ok(!isRelevantDeal(deal('Popular but poorly reviewed', '80.00', '70', '50000')));
});

test('a recent, loved, deeply discounted game at its lowest price ranks above an old one that is always on sale', () => {
  const now = Date.parse('2026-11-21');
  const deal = (over) => ({ reviews: 50_000, savings: 75, rating: 92, releasedAt: Date.parse('2025-01-01'), ...over });
  const score = (over, atLow) => dealScore(deal(over), atLow, now);

  assert.ok(score({}) > score({ releasedAt: Date.parse('2012-01-01') }), 'newer');
  assert.ok(score({ releasedAt: Date.parse('2012-01-01') }) > score({ releasedAt: undefined }) - 1e-9, 'an unknown release counts as old');
  assert.ok(score({}, true) > score({}), 'at its lowest price');
  assert.ok(score({ savings: 90 }) > score({}), 'a bigger discount');
  assert.ok(score({ rating: 97 }) > score({}), 'better reviewed');
  assert.ok(score({ reviews: 150_000 }) > score({}), 'more popular');
  assert.ok(
    score({ reviews: 69_000, savings: 67 }, true) > score({ reviews: 123_000, savings: 85, releasedAt: Date.parse('2012-09-18') }),
    'a lowest price outweighs popularity',
  );
  assert.ok(score({ reviews: 10_000_000, savings: 100, rating: 100, releasedAt: Date.now() }, true) <= 1, 'never above 1');
});

test('the editions of a game share its name, and different games do not', () => {
  assert.equal(baseTitle('Borderlands 2: Game of the Year Edition'), baseTitle('Borderlands 2'));
  assert.equal(baseTitle('STAR WARS Jedi: Fallen Order Deluxe Edition'), baseTitle('STAR WARS Jedi: Fallen Order'));
  assert.equal(baseTitle('Sea of Thieves: 2026 Edition'), 'sea of thieves');
  assert.equal(baseTitle('Ghost of Tsushima DIRECTOR’S CUT'), 'ghost of tsushima');
  assert.equal(baseTitle('Sid Meier’s Civilization® VI'), 'sid meier’s civilization vi');
  assert.notEqual(baseTitle('Ori and the Blind Forest: Definitive Edition'), baseTitle('Ori and the Will of the Wisps'));
  assert.equal(baseTitle('Halo: The Master Chief Collection'), 'halo: the master chief collection');
  assert.notEqual(baseTitle('Just Cause 2'), baseTitle('Just Cause 3'));
});

test('of the editions of a game on sale only the best ranked stays, and keeps the others to be told apart later', () => {
  const ranked = [
    { key: 'deal:1', title: 'Borderlands 2: Game of the Year Edition' },
    { key: 'deal:2', title: 'Kerbal Space Program' },
    { key: 'deal:3', title: 'Borderlands 2' },
  ];
  assert.deepEqual(withoutDuplicateEditions(ranked), [
    { key: 'deal:1', title: 'Borderlands 2: Game of the Year Edition', alsoKeys: ['deal:3'] },
    { key: 'deal:2', title: 'Kerbal Space Program', alsoKeys: [] },
  ]);
});

test('a new server only has the features that need no setup', () => {
  const guildId = 'a server the bot has never seen';
  assert.ok(isEnabled(guildId, 'music'));
  assert.ok(isEnabled(guildId, 'fun'), 'its channel is optional');
  assert.ok(!isEnabled(guildId, 'welcome'));
  assert.deepEqual(missingSettings(guildId, 'gameAlerts'), ['alertsChannel'], 'the subscriber role is optional');
});

test('every command feature exists', async () => {
  for (const [name, command] of await loadCommands()) {
    if (command.feature) assert.ok(features[command.feature], `${name} points to an unknown feature`);
  }
});

test('a failing daily task is tried 3 times, 10 minutes apart, then gives up for the day', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(console, 'error', () => {});
  const minutes = async (n) => {
    t.mock.timers.tick(n * 60_000);
    for (let i = 0; i < 20; i++) await Promise.resolve();
  };

  let calls = 0;
  let gaveUp = false;
  withRetries(async () => {
    calls++;
    throw new Error('the API timed out');
  }).then(() => (gaveUp = true));
  await minutes(0);
  assert.equal(calls, 1);
  await minutes(10);
  assert.equal(calls, 2);
  await minutes(10);
  assert.equal(calls, 3);
  assert.ok(gaveUp, 'no fourth attempt');
});

test('the shiba of the day only repeats once every photo was posted', () => {
  assert.deepEqual(unseenPhotos([1, 2, 3], [1, 3]), { unseen: [2], seen: [1, 3] });
  assert.deepEqual(unseenPhotos([1, 2, 3], [3, 1, 2]), { unseen: [1, 2, 3], seen: [] }, 'a new round starts');
  assert.deepEqual(unseenPhotos([1, 2], [5]), { unseen: [1, 2], seen: [5] }, 'photos removed from Commons are ignored');
});

test('the shiba of the day is always a landscape photo', () => {
  assert.ok(isLandscape({ width: 4000, height: 3000 }));
  assert.ok(isLandscape({ width: 1920, height: 1080 }));
  assert.ok(!isLandscape({ width: 3000, height: 4000 }), 'portrait');
  assert.ok(!isLandscape({ width: 1100, height: 1000 }), 'nearly square');
  assert.ok(!isLandscape(undefined), 'size unknown');
});

test('a ship score is a stable percentage, whoever comes first', () => {
  const score = shipScore('408450693524094977', '287806756917084161');
  assert.ok(Number.isInteger(score) && score >= 0 && score <= 100);
  assert.equal(shipScore('287806756917084161', '408450693524094977'), score);
  assert.equal(shipScore('408450693524094977', '287806756917084161'), score, 'same pair, same score');
});

test('couple names join two first names between syllables', () => {
  assert.equal(coupleName('Ricardo (Rei do Pagode)', 'Valentina'), 'Ricatina');
  assert.equal(coupleName('Jorge', 'Ana'), 'Joana', 'short names go in whole');
  assert.equal(coupleName('🔥 Mari 🔥', 'Lúcia'), 'Macia');
  assert.equal(coupleName('xX_Pedro_Xx', 'Fernanda'), 'Penanda');
});

test('first names leave out nicknames in brackets, emoji and gamer tags', () => {
  assert.equal(firstName('Ricardo (Rei do Pagode)'), 'Ricardo');
  assert.equal(firstName('xX_Pedro_Xx'), 'Pedro');
  assert.equal(firstName(' Lu '), 'Lu');
  assert.equal(firstName('🎮🎮'), '');
});

test('track durations are formatted like a player', () => {
  assert.equal(formatDuration(5), '0:05');
  assert.equal(formatDuration(196), '3:16');
  assert.equal(formatDuration(2330), '38:50');
  assert.equal(formatDuration(3725), '1:02:05');
});

test('spotify links are recognized however they were shared', () => {
  const playlist = { type: 'playlist', id: '37i9dQZF1DXcBWIGoYBM5M' };
  assert.deepEqual(parseSpotifyLink('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=0a1b2c3d4e5f6a7b'), playlist);
  assert.deepEqual(parseSpotifyLink(' https://open.spotify.com/intl-pt/playlist/37i9dQZF1DXcBWIGoYBM5M '), playlist);
  assert.deepEqual(parseSpotifyLink('spotify:playlist:37i9dQZF1DXcBWIGoYBM5M'), playlist, 'the URI the desktop app copies');
  assert.deepEqual(parseSpotifyLink('https://open.spotify.com/album/4LH4d3cOWNNsVw41Gqt2kv'), {
    type: 'album',
    id: '4LH4d3cOWNNsVw41Gqt2kv',
  });
  assert.deepEqual(parseSpotifyLink('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC'), {
    type: 'track',
    id: '4uLU6hMCjMI75M1A2tKUQC',
  });
  assert.equal(parseSpotifyLink('https://open.spotify.com/artist/0gxyHStUsqpMadRV0Di1Qt'), null, 'artists are not lists');
  assert.equal(parseSpotifyLink('yt:qu1_lRJ-hPA'), null);
  assert.equal(parseSpotifyLink('never gonna give you up'), null);
});

test('the recording played is the first one about as long as the spotify track', () => {
  const song = (artist, duration) => ({ artist, duration });
  const springsteen = [song('Bruce Springsteen', 279), song('David Clooney', 280)];
  assert.equal(pickRecording(springsteen, 280), springsteen[0], 'a cover of the same length comes later');
  const tyler = [song('Bonnie Tyler, album version', 418), song('Bonnie Tyler, single edit', 275)];
  assert.equal(pickRecording(tyler, 267), tyler[1]);
  assert.equal(pickRecording(tyler, 600), tyler[0], 'none as long: the first one');
  assert.equal(pickRecording([], 200), null);
});
