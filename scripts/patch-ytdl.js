// @distube/ytdl-core gives YouTube's player script 10 seconds to load in its worker. On hosting plans with a fraction
// of a CPU that is not enough, and every /play fails with "Could not prepare player". There is no option for it, so
// this raises the deadline after every npm install. It never fails the install: at worst the deadline stays as is.
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../node_modules/@distube/ytdl-core/dist/solver/index.js', import.meta.url);
const DEADLINE = 'const CALL_DEADLINE_MS = 60_000;';

try {
  const source = readFileSync(file, 'utf8');
  if (!source.includes(DEADLINE)) {
    const patched = source.replace(/const CALL_DEADLINE_MS = [\d_]+;/, DEADLINE);
    if (patched === source) {
      console.warn('patch-ytdl: the deadline was not found, @distube/ytdl-core changed; slow hosts may time out');
    } else {
      writeFileSync(file, patched);
      console.log('patch-ytdl: YouTube player deadline raised to 60s');
    }
  }
} catch (error) {
  console.warn('patch-ytdl: could not patch @distube/ytdl-core:', error.message);
}
