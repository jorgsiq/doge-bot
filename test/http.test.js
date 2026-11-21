import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getJson, timeoutSignal } from '../src/lib/http.js';
import { reactionGif } from '../src/lib/reactions.js';
import { pick, shuffle } from '../src/lib/random.js';

const answer = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

test('requests identify the bot and return the JSON', async (context) => {
  const fetch = context.mock.method(globalThis, 'fetch', async () => answer({ hello: 'world' }));

  assert.deepEqual(await getJson('https://example.com/data'), { hello: 'world' });
  assert.match(fetch.mock.calls[0].arguments[1].headers['user-agent'], /^doge-bot \(\+https:\/\//);
});

test('a failing service is reported with its host and status', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => answer({}, 503));

  await assert.rejects(getJson('https://example.com/data'), { message: 'example.com responded with 503' });
});

test('a request is cancelled by its own timeout or by the signal it was given', () => {
  const controller = new AbortController();
  const signal = timeoutSignal(60_000, controller.signal);
  assert.equal(signal.aborted, false);
  controller.abort();
  assert.equal(signal.aborted, true);

  assert.equal(timeoutSignal(60_000).aborted, false);
});

test('a reaction GIF comes from the next source when the first is down', async (context) => {
  context.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).includes('nekos.best')) throw new Error('down');
    return answer({ url: 'https://gifs.example/kiss.gif' });
  });

  assert.equal(await reactionGif('kiss'), 'https://gifs.example/kiss.gif');
});

test('a reaction GIF is null when every source is down', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => {
    throw new Error('down');
  });

  assert.equal(await reactionGif('kiss'), null);
});

test('shuffling keeps every item, in place', () => {
  const list = Array.from({ length: 50 }, (_, i) => i);
  const result = shuffle(list);

  assert.equal(result, list);
  assert.deepEqual(
    [...list].sort((a, b) => a - b),
    Array.from({ length: 50 }, (_, i) => i),
  );
  assert.notDeepEqual(
    list,
    Array.from({ length: 50 }, (_, i) => i),
    'in 50 items, staying sorted by chance is not a thing',
  );
});

test('picking gives an item of the list', () => {
  assert.ok(['a', 'b', 'c'].includes(pick(['a', 'b', 'c'])));
  assert.equal(pick(['only']), 'only');
});
