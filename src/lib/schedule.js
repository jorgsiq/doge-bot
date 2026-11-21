import * as store from './store.js';

const lastRuns = store.section('dailyTasks');

// Checked every minute instead of one long timer: a host that pauses the bot loses the timer and the day's task was skipped
const CHECK_EVERY = 60_000;
const HOUR = 60 * 60_000;

// Tasks only throw when nothing was posted (each server's failure is caught inside), so a retry never posts twice
const ATTEMPTS = 3;
const RETRY_DELAY = 10 * 60_000;

// The last time the clock struck the given UTC hour, today or yesterday; given a weekday (0 is Sunday), on the last such day
export function lastOccurrence(hourUtc, now = new Date(), weekdayUtc) {
  const at = new Date(now);
  at.setUTCHours(hourUtc, 0, 0, 0);
  if (at > now) at.setUTCDate(at.getUTCDate() - 1);
  if (weekdayUtc !== undefined) at.setUTCDate(at.getUTCDate() - ((at.getUTCDay() - weekdayUtc + 7) % 7));
  return at.getTime();
}

export function isDue(hourUtc, maxDelayHours, lastRun = 0, now = new Date(), weekdayUtc) {
  const at = lastOccurrence(hourUtc, now, weekdayUtc);
  return lastRun < at && now - at < maxDelayHours * HOUR;
}

export async function withRetries(task) {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      return await task();
    } catch (error) {
      console.error(`Scheduled task failed (attempt ${attempt} of ${ATTEMPTS}):`, error);
      if (attempt < ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

function runAt(name, hourUtc, weekdayUtc, maxDelayHours, task) {
  let running = false;
  const check = async () => {
    if (running || !isDue(hourUtc, maxDelayHours, lastRuns[name], new Date(), weekdayUtc)) return;
    running = true;
    try {
      // marked before it runs: a bot stopped halfway skips that run rather than posting twice
      lastRuns[name] = Date.now();
      await store.save();
      await withRetries(task);
    } finally {
      running = false;
    }
  };
  check();
  setInterval(check, CHECK_EVERY);
}

export const everyDayAt = (name, hourUtc, maxDelayHours, task) => runAt(name, hourUtc, undefined, maxDelayHours, task);

export const everyWeekAt = (name, weekdayUtc, hourUtc, maxDelayHours, task) => runAt(name, hourUtc, weekdayUtc, maxDelayHours, task);
