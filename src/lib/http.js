import config from '../config.js';

const HEADERS = { 'user-agent': `doge-bot (+${config.repositoryUrl})` };

export const timeoutSignal = (ms, signal) => (signal ? AbortSignal.any([AbortSignal.timeout(ms), signal]) : AbortSignal.timeout(ms));

export async function getJson(url, { timeout = 15_000, signal } = {}) {
  const response = await fetch(url, { headers: HEADERS, signal: timeoutSignal(timeout, signal) });
  if (!response.ok) throw new Error(`${new URL(url).host} responded with ${response.status}`);
  return response.json();
}
