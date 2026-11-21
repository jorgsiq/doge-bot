import assert from 'node:assert/strict';
import { setImmediate as nextTick } from 'node:timers/promises';
import { test } from 'node:test';
import { GuildQueue, createQueue, getQueue } from '../src/lib/music.js';

let nextGuild = 0;

function fakeChannels() {
  const sent = [];
  const guild = { id: `guild-${nextGuild++}`, voiceAdapterCreator: () => ({ sendPayload: () => true, destroy() {} }) };
  return {
    voiceChannel: { id: 'voice', guild },
    textChannel: { send: async (payload) => void sent.push(payload) },
    sent,
  };
}

const track = (id, createStream = () => new Promise(() => {})) => ({
  id,
  title: `Song ${id}`,
  artist: 'Artist',
  duration: 100,
  source: 'Test',
  requestedBy: { username: 'someone' },
  createStream,
});

function newQueue(context) {
  const channels = fakeChannels();
  const queue = new GuildQueue(channels.voiceChannel, channels.textChannel);
  context.after(() => queue.destroy());
  return { queue, ...channels };
}

test('the first track starts at once and the next ones wait their turn', (context) => {
  const { queue } = newQueue(context);
  const [first, second, third] = ['a', 'b', 'c'].map((id) => track(id));

  assert.equal(queue.add(first, second), true);
  assert.equal(queue.current, first);
  assert.deepEqual(queue.tracks, [second]);
  assert.equal(queue.add(third), false, 'something is already playing');
  assert.deepEqual(queue.tracks, [second, third]);
});

test('a stream that finishes loading after a skip is thrown away', async (context) => {
  const { queue } = newQueue(context);
  let finishLoading;
  const stream = {
    destroyed: false,
    destroy() {
      this.destroyed = true;
    },
  };
  const slow = track('slow', () => new Promise((resolve) => (finishLoading = resolve)));
  const next = track('next');

  queue.add(slow, next);
  queue.skip();
  assert.equal(queue.current, next, 'skipped straight past the track still loading');

  finishLoading(stream);
  await nextTick();
  assert.ok(stream.destroyed, 'nobody is going to play it');
  assert.equal(queue.current, next);
});

test('three tracks in a row that fail to load stop the queue, telling the channel', async (context) => {
  context.mock.method(console, 'error', () => {});
  const { queue, sent } = newQueue(context);
  const failing = (id) =>
    track(id, async () => {
      throw new Error('YouTube refused');
    });

  queue.add(failing('a'), failing('b'), failing('c'), track('d'));
  for (let i = 0; i < 20 && !queue.destroyed; i++) await nextTick();

  assert.ok(queue.destroyed);
  assert.equal(getQueue(queue.guildId), undefined);
  const notices = sent.filter((message) => message.content);
  assert.equal(notices.length, 2, 'the first two failures say that the track was skipped');
  assert.match(notices[0].content, /Song a/);
  assert.match(sent.at(-1).embeds[0].data.description, /last 3 songs/);
});

test('shuffling keeps what is playing and every waiting track', (context) => {
  const { queue } = newQueue(context);
  const tracks = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => track(id));
  queue.add(...tracks);

  queue.shuffle();
  assert.equal(queue.current, tracks[0]);
  assert.deepEqual(
    [...queue.tracks].sort((x, y) => x.id.localeCompare(y.id)),
    tracks.slice(1),
  );
});

test('stopping the queue while it is still connecting gives up the connection', async () => {
  const { voiceChannel, textChannel } = fakeChannels();
  const connecting = createQueue(voiceChannel, textChannel);

  const queue = getQueue(voiceChannel.guild.id);
  assert.ok(queue, 'the queue exists while it connects');
  queue.destroy();

  await assert.rejects(connecting);
  assert.equal(getQueue(voiceChannel.guild.id), undefined);
});
