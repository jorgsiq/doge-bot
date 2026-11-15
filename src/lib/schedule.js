import * as store from './store.js';

// task name -> when it last ran, kept across restarts so a task never runs twice for the same day or week
const lastRuns = store.section('dailyTasks');

// The clock is checked every minute instead of waiting on one long timer: a host that stops or pauses the bot loses
// that timer, and the day's task was skipped even when the bot came back hours before the day was over
const CHECK_EVERY = 60_000;
const HOUR = 60 * 60_000;

// A task that fails, say on an API timing out, is tried again before the day is skipped. Tasks only throw when
// nothing was posted (each server's own failure is caught inside), so a retry never posts twice.
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

// Due from its hour on, unless it already ran since then or it is more than maxDelayHours late
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

// Runs the task from the given UTC hour on, every day or only on the given weekday. A bot that was offline at that hour
// runs it once it is back, up to maxDelayHours late; failures are logged and don't stop the schedule
function runAt(name, hourUtc, weekdayUtc, maxDelayHours, task) {
  let running = false;
  const check = async () => {
    if (running || !isDue(hourUtc, maxDelayHours, lastRuns[name], new Date(), weekdayUtc)) return;
    running = true;
    // marked before it runs: a bot stopped halfway skips that run rather than posting twice
    lastRuns[name] = Date.now();
    await store.save();
    await withRetries(task);
    running = false;
  };
  check();
  setInterval(check, CHECK_EVERY);
}

export const everyDayAt = (name, hourUtc, maxDelayHours, task) => runAt(name, hourUtc, undefined, maxDelayHours, task);

export const everyWeekAt = (name, weekdayUtc, hourUtc, maxDelayHours, task) =>
  runAt(name, hourUtc, weekdayUtc, maxDelayHours, task);
