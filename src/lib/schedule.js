export function msUntilHourUtc(hourUtc, now = new Date()) {
  const next = new Date(now);
  next.setUTCHours(hourUtc, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next - now;
}

// A task that fails, say on an API timing out, is tried again before the day is skipped. Tasks only throw when
// nothing was posted (each server's own failure is caught inside), so a retry never posts twice.
const ATTEMPTS = 3;
const RETRY_DELAY = 10 * 60_000;

// Runs the task every day at the given UTC hour; failures are logged and don't stop the schedule
export function everyDayAt(hourUtc, task) {
  setTimeout(async () => {
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        await task();
        break;
      } catch (error) {
        console.error(`Scheduled task failed (attempt ${attempt} of ${ATTEMPTS}):`, error);
        if (attempt < ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
    everyDayAt(hourUtc, task);
  }, msUntilHourUtc(hourUtc));
}
