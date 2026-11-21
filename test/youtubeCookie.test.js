import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as store from '../src/lib/store.js';
import { applySetCookies, getCookie, keepCookieAlive, parseCookies, rotateCookie } from '../src/lib/youtubeCookie.js';

process.env.YOUTUBE_COOKIE = 'SAPISID=abc; __Secure-1PSIDTS=old; SIDCC=gone';

const answer = (status, ...setCookies) => ({
  status,
  ok: status < 400,
  headers: new Headers(setCookies.map((value) => ['set-cookie', value])),
});
const nextTick = () => new Promise((resolve) => setImmediate(resolve));

test('set-cookie lines update, add and delete cookies, saying whether anything changed', () => {
  const cookies = parseCookies('a=1; b=2; c=3; d=4');

  assert.equal(applySetCookies(cookies, ['a=1; Path=/; Secure']), false, 'the same value is not a change');
  assert.equal(
    applySetCookies(cookies, ['a=9; Path=/', 'e=5; Secure', 'b=; Path=/', 'c=3; Max-Age=0', 'd=4; Expires=Thu, 01 Jan 1970 00:00:00 GMT']),
    true,
  );
  assert.deepEqual(
    [...cookies],
    [
      ['a', '9'],
      ['e', '5'],
    ],
  );
});

test('a rotation keeps the renewed cookies, for later sessions and for the next start', async (context) => {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url, init });
    return answer(200, '__Secure-1PSIDTS=new; Path=/; Secure; HttpOnly', 'SIDCC=; Max-Age=0');
  });

  assert.equal(getCookie(), 'SAPISID=abc; __Secure-1PSIDTS=old; SIDCC=gone');
  assert.equal(await rotateCookie(), true);

  assert.equal(calls[0].url, 'https://accounts.youtube.com/RotateCookies');
  assert.equal(calls[0].init.headers.cookie, 'SAPISID=abc; __Secure-1PSIDTS=old; SIDCC=gone');
  assert.equal(calls[0].init.headers.origin, 'https://accounts.youtube.com');
  assert.equal(getCookie(), 'SAPISID=abc; __Secure-1PSIDTS=new');
  assert.equal(store.section('youtubeCookie').cookie, 'SAPISID=abc; __Secure-1PSIDTS=new');
  assert.equal(await rotateCookie(), false, 'nothing new the second time');

  const restarted = await import('../src/lib/youtubeCookie.js?restart');
  assert.equal(restarted.getCookie(), 'SAPISID=abc; __Secure-1PSIDTS=new', 'the renewed cookie wins over the one in .env');
});

test('a cookie pasted into .env replaces the renewed one', async () => {
  process.env.YOUTUBE_COOKIE = 'SAPISID=fresh; __Secure-1PSIDTS=fresh';
  const replaced = await import('../src/lib/youtubeCookie.js?replaced');
  assert.equal(replaced.getCookie(), 'SAPISID=fresh; __Secure-1PSIDTS=fresh');
});

test('Google refusing to renew the cookie is reported', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => answer(401));
  await assert.rejects(rotateCookie(), /refused to renew/);

  context.mock.method(globalThis, 'fetch', async () => answer(500));
  await assert.rejects(rotateCookie(), /answered 500/);
});

test('keeping the cookie alive tells the session when it changed, and logs only changes of state', async (context) => {
  const log = context.mock.method(console, 'log', () => {});
  const error = context.mock.method(console, 'error', () => {});
  context.mock.method(globalThis, 'fetch', async () => answer(200, `__Secure-1PSIDTS=${Math.random()}; Path=/`));
  let changes = 0;

  keepCookieAlive(() => changes++);
  await nextTick();
  await store.flush();
  await nextTick();

  assert.equal(changes, 1);
  assert.deepEqual(
    log.mock.calls.map((call) => call.arguments[0]),
    ['YouTube cookie is valid'],
  );
  assert.equal(error.mock.callCount(), 0);
});
