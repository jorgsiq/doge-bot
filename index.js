// Panels only `git pull` in a git repository, which uploaded files never are; .env and data/ are git-ignored and stay untouched

// Panels may start index.js through ts-node (~100 MB of RAM); execve swaps it for plain node with the same pid, so the panel keeps tracking it
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
  // The panel installed the previous version's dependencies; the dev tools (linter, formatter) aren't needed to run
  if (lockfile() !== before) run('npm', 'install', '--omit=dev', '--no-fund', '--no-audit');
}

if (['1', 'true'].includes(process.env.AUTO_UPDATE)) {
  try {
    updateFromGitHub();
  } catch (error) {
    console.error('Could not update from GitHub, starting the current version:', error.message);
  }
}

await import('./src/index.js');
