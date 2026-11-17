// Hosting panels (bot-hosting.net, obsdnhost...) start index.js. With the panel's Auto Update on, it first syncs the
// code with GitHub: those panels only run `git pull` in a folder that already is a git repository, and files uploaded
// by hand never are. .env and data/ are git-ignored, so they are left alone.

// Some panels start index.js through ts-node (their startup command only uses plain node when MAIN_FILE is literally
// "*.js"), which keeps the whole TypeScript compiler in memory: about 100 MB of the 256 MB of a small plan, for a bot
// written in plain JavaScript. execve swaps this process for plain node, with the same pid, so the panel keeps tracking it.
if (process.execArgv.some((argument) => argument.includes('ts-node')) && typeof process.execve === 'function') {
  try {
    process.execve(process.execPath, [process.execPath, ...process.argv.slice(1)]);
  } catch (error) {
    console.error('Could not leave ts-node, going on with it:', error.message);
  }
}

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPOSITORY = 'https://github.com/jorgsiq/doge-bot.git';
const root = fileURLToPath(new URL('.', import.meta.url));
const run = (command, ...args) => execFileSync(command, args, { cwd: root, stdio: 'inherit' });
const lockfile = () => (existsSync(`${root}package-lock.json`) ? readFileSync(`${root}package-lock.json`, 'utf8') : '');

function updateFromGitHub() {
  const before = lockfile();
  if (!existsSync(`${root}.git`)) {
    run('git', 'init', '-q');
    run('git', 'remote', 'add', 'origin', REPOSITORY);
  }
  run('git', 'fetch', '-q', 'origin', 'master');
  run('git', 'reset', '-q', '--hard', 'origin/master');
  // the panel already installed the dependencies, but of the previous version
  if (lockfile() !== before) run('npm', 'install', '--no-fund', '--no-audit');
}

if (['1', 'true'].includes(process.env.AUTO_UPDATE)) {
  try {
    updateFromGitHub();
  } catch (error) {
    console.error('Could not update from GitHub, starting the current version:', error.message);
  }
}

await import('./src/index.js');
