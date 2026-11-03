// Hosting panels (bot-hosting.net, obsdnhost...) start index.js. With the panel's Auto Update on, it first syncs the
// code with GitHub: those panels only run `git pull` in a folder that already is a git repository, and files uploaded
// by hand never are. .env and data/ are git-ignored, so they are left alone.
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
