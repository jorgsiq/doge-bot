import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Each test process keeps its store in a temporary folder, never in the real data/
const dir = mkdtempSync(join(tmpdir(), 'doge-bot-test-'));
process.env.DATA_DIR = dir;
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
