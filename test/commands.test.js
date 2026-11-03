import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadCommands } from '../src/lib/commands.js';
import { isRelevantDeal, isReputableFreeGame } from '../src/lib/games.js';
import { formatDuration } from '../src/lib/music.js';
import { features, isEnabled, missingSettings } from '../src/lib/settings.js';
import { everyDayAt, msUntilHourUtc } from '../src/lib/schedule.js';
import { coupleName, firstName, shipScore } from '../src/lib/reactions.js';
import { unseenPhotos } from '../src/lib/shiba.js';
import { parseSpotifyLink } from '../src/lib/spotify.js';
import { pickRecording } from '../src/lib/tracks.js';

test('every command is valid for the Discord API', async () => {
  const commands = await loadCommands();
  assert.ok(commands.size > 0);

  for (const [name, command] of commands) {
    assert.equal(typeof command.execute, 'function', `${name} has no execute`);
    assert.ok(command.category, `${name} has no category`);
    // toJSON runs the builder validations (names, descriptions, option limits)
    assert.equal(command.data.toJSON().name, name);
  }
});

test('daily tasks wait until the next occurrence of their UTC hour', () => {
  const hour = 60 * 60_000;
  assert.equal(msUntilHourUtc(9, new Date('2026-01-01T08:00:00Z')), hour);
  assert.equal(msUntilHourUtc(9, new Date('2026-01-01T09:00:00Z')), 24 * hour);
  assert.equal(msUntilHourUtc(9, new Date('2026-01-01T10:00:00Z')), 23 * hour);
});

// CheapShark entries seen in November 2026
test('free games need a price and a reputation', () => {
  const free = (title, normalPrice, steamRatingPercent, steamRatingCount, metacriticScore) => ({
    title, normalPrice, steamRatingPercent, steamRatingCount, metacriticScore,
  });
  assert.ok(isReputableFreeGame(free("Sorry We're Closed", '24.99', '98', '1684', '83')));
  assert.ok(isReputableFreeGame(free('Only on GOG, well rated by critics', '19.99', '0', '0', '78')));
  assert.ok(!isReputableFreeGame(free('MAFIA HOTEL', '1.99', '0', '0', '0')));
  assert.ok(!isReputableFreeGame(free('Gladiator: Blades of Fury', '9.99', '0', '0', '0')));
  assert.ok(!isReputableFreeGame(free('Free-to-play', '0.00', '90', '50000', '0')));
});

test('deals need a big discount on a popular, well reviewed game', () => {
  const deal = (title, savings, steamRatingPercent, steamRatingCount) => ({
    title, savings, steamRatingPercent, steamRatingCount, steamAppID: '1',
  });
  assert.ok(isRelevantDeal(deal('LIMBO', '90.07', '91', '13172')));
  assert.ok(isRelevantDeal(deal('Slime Rancher', '75.00', '98', '66023')));
  assert.ok(!isRelevantDeal(deal('Lacuna, too few reviews', '90.06', '92', '735')));
  assert.ok(!isRelevantDeal(deal('Balatro, discount too small', '20.00', '98', '105457')));
  assert.ok(!isRelevantDeal(deal('Popular but poorly reviewed', '80.00', '70', '50000')));
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

test('a failing daily task is tried 3 times, 10 minutes apart, then waits for the next day', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: new Date('2026-11-01T20:59:00Z') });
  t.mock.method(console, 'error', () => {});
  const minutes = async (n) => {
    t.mock.timers.tick(n * 60_000);
    // lets the awaited task and its retry timer settle
    for (let i = 0; i < 20; i++) await Promise.resolve();
  };

  let calls = 0;
  everyDayAt(21, async () => {
    calls++;
    throw new Error('the API timed out');
  });
  await minutes(1);
  assert.equal(calls, 1);
  await minutes(10);
  await minutes(10);
  assert.equal(calls, 3);
  await minutes(60);
  assert.equal(calls, 3, 'the day is skipped after 3 attempts');
  await minutes(24 * 60);
  assert.equal(calls, 4, 'and the next day runs as usual');
});

test('the shiba of the day only repeats once every photo was posted', () => {
  assert.deepEqual(unseenPhotos([1, 2, 3], [1, 3]), { unseen: [2], seen: [1, 3] });
  assert.deepEqual(unseenPhotos([1, 2, 3], [3, 1, 2]), { unseen: [1, 2, 3], seen: [] }, 'a new round starts');
  assert.deepEqual(unseenPhotos([1, 2], [5]), { unseen: [1, 2], seen: [5] }, 'photos removed from Commons are ignored');
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
  assert.deepEqual(parseSpotifyLink('https://open.spotify.com/album/4LH4d3cOWNNsVw41Gqt2kv'), { type: 'album', id: '4LH4d3cOWNNsVw41Gqt2kv' });
  assert.deepEqual(parseSpotifyLink('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC'), { type: 'track', id: '4uLU6hMCjMI75M1A2tKUQC' });
  assert.equal(parseSpotifyLink('https://open.spotify.com/artist/0gxyHStUsqpMadRV0Di1Qt'), null, 'artists are not lists');
  assert.equal(parseSpotifyLink('yt:qu1_lRJ-hPA'), null);
  assert.equal(parseSpotifyLink('never gonna give you up'), null);
});

// YouTube Music results seen in November 2026
test('the recording played is the first one about as long as the spotify track', () => {
  const song = (artist, duration) => ({ artist, duration });
  const springsteen = [song('Bruce Springsteen', 279), song('David Clooney', 280)];
  assert.equal(pickRecording(springsteen, 280), springsteen[0], 'a cover of the same length comes later');
  const tyler = [song('Bonnie Tyler, album version', 418), song('Bonnie Tyler, single edit', 275)];
  assert.equal(pickRecording(tyler, 267), tyler[1]);
  assert.equal(pickRecording(tyler, 600), tyler[0], 'none as long: the first one');
  assert.equal(pickRecording([], 200), null);
});
