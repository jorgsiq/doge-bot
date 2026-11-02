import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';

// Small JSON file for the state that has to survive restarts
const dir = new URL('../../data/', import.meta.url);
const file = new URL('store.json', dir);
const tempFile = new URL('store.json.tmp', dir);

let data = {};
try {
  data = JSON.parse(await readFile(file, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

// A mutable object kept under `name`; call save() after changing it
export function section(name) {
  return (data[name] ??= {});
}

let writing = Promise.resolve();

export function save() {
  // writes run one after another, and writing to a temp file then renaming keeps the file whole if the bot dies mid-write
  writing = writing
    .then(async () => {
      await mkdir(dir, { recursive: true });
      await writeFile(tempFile, JSON.stringify(data, null, 2));
      await rename(tempFile, file);
    })
    .catch((error) => console.error('Failed to save the store:', error));
  return writing;
}
