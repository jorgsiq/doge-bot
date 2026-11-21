import { createHash } from 'node:crypto';
import { timeoutSignal } from './http.js';
import * as store from './store.js';

const ROTATE_ORIGIN = 'https://accounts.youtube.com';
const ROTATE_EVERY = 10 * 60_000;
const saved = store.section('youtubeCookie');

export function parseCookies(header) {
  const cookies = new Map();
  for (const part of header.split(';')) {
    const equals = part.indexOf('=');
    if (equals > 0) cookies.set(part.slice(0, equals).trim(), part.slice(equals + 1).trim());
  }
  return cookies;
}

export const cookieHeader = (cookies) => [...cookies].map(([name, value]) => `${name}=${value}`).join('; ');

function isExpired(attribute) {
  const [key, value = ''] = attribute.split('=');
  if (key.toLowerCase() === 'max-age') return Number(value) <= 0;
  if (key.toLowerCase() === 'expires') return Date.parse(value) < Date.now();
  return false;
}

export function applySetCookies(cookies, setCookies) {
  let changed = false;
  for (const line of setCookies) {
    const [pair, ...attributes] = line.split(';').map((part) => part.trim());
    const equals = pair.indexOf('=');
    if (equals <= 0) continue;
    const name = pair.slice(0, equals);
    const value = pair.slice(equals + 1);
    if (!value || attributes.some(isExpired)) changed = cookies.delete(name) || changed;
    else if (cookies.get(name) !== value) {
      cookies.set(name, value);
      changed = true;
    }
  }
  return changed;
}

let cookies;

function load() {
  const source = process.env.YOUTUBE_COOKIE?.trim();
  if (!source || source.includes('\t')) return undefined;
  const fingerprint = createHash('sha256').update(source).digest('hex');
  // a cookie newly pasted into .env replaces the renewed one kept from the previous value
  if (saved.source !== fingerprint) Object.assign(saved, { source: fingerprint, cookie: source });
  return parseCookies(saved.cookie);
}

const jar = () => (cookies ??= load());

export function getCookie() {
  const cookies = jar();
  return cookies ? cookieHeader(cookies) : process.env.YOUTUBE_COOKIE?.trim() || undefined;
}

export async function rotateCookie() {
  const response = await fetch(`${ROTATE_ORIGIN}/RotateCookies`, {
    method: 'POST',
    headers: { cookie: cookieHeader(jar()), 'content-type': 'application/json', origin: ROTATE_ORIGIN },
    body: '[000,"-0000000000000000000"]',
    signal: timeoutSignal(15_000),
  });
  if (response.status === 401)
    throw new Error('Google refused to renew it (HTTP 401); if /play fails with AUTH_FAILED too, export a fresh one');
  if (!response.ok) throw new Error(`Google answered ${response.status}`);
  const changed = applySetCookies(jar(), response.headers.getSetCookie());
  if (changed) {
    saved.cookie = cookieHeader(jar());
    await store.save();
  }
  return changed;
}

export function keepCookieAlive(onChange) {
  if (!jar()) return;
  let last;
  const tick = async () => {
    let status = 'valid';
    try {
      if (await rotateCookie()) onChange();
    } catch (error) {
      status = error.message;
    }
    if (status === last) return;
    last = status;
    if (status === 'valid') console.log('YouTube cookie is valid');
    else console.error(`YouTube cookie: ${status}`);
  };
  tick();
  setInterval(tick, ROTATE_EVERY).unref();
}
