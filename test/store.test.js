import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import * as store from '../src/lib/store.js';

const file = join(process.env.DATA_DIR, 'store.json');

test('the store is written whole, even when saves overlap', async () => {
  const section = store.section('overlap');
  section.first = 1;
  const saves = [store.save()];
  section.second = 2;
  saves.push(store.save());
  await Promise.all(saves);
  await store.flush();

  assert.deepEqual(JSON.parse(await readFile(file, 'utf8')).overlap, { first: 1, second: 2 });
  assert.ok(!existsSync(`${file}.tmp`), 'the temporary file was renamed away');
});

test('a section is the same object every time, so changes to it are what gets saved', () => {
  assert.equal(store.section('same'), store.section('same'));
});

test('the tests never touch the real data folder', () => {
  assert.notEqual(process.env.DATA_DIR, undefined);
  assert.ok(!process.env.DATA_DIR.endsWith('data'));
});
