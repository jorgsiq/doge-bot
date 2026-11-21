import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Locale, PermissionsBitField } from 'discord.js';
import { loadCommands } from '../src/lib/commands.js';
import { DEFAULT_LOCALE, languages, localizations, t } from '../src/lib/i18n.js';
import { features, settingDefinitions } from '../src/lib/settings.js';

const localesDir = fileURLToPath(new URL('../src/locales/', import.meta.url));
const srcDir = fileURLToPath(new URL('../src/', import.meta.url));
const locales = readdirSync(localesDir).map((file) => file.replace(/\.json$/, ''));

const readLocale = (locale) => JSON.parse(readFileSync(`${localesDir}${locale}.json`, 'utf8'));

function flatten(node, path, into = {}) {
  if (typeof node === 'string' || Array.isArray(node)) into[path] = node;
  else for (const [key, child] of Object.entries(node)) flatten(child, path ? `${path}.${key}` : key, into);
  return into;
}

const messagesOf = (locale) => flatten(readLocale(locale), '');

const baseKey = (key) => key.replace(/_(zero|one|two|few|many|other)$/, '');
const placeholdersOf = (text) =>
  [
    ...[text]
      .flat()
      .join(' ')
      .matchAll(/\{(\w+)\}/g),
  ].map((match) => match[1]);

function grouped(locale) {
  const groups = {};
  for (const [key, value] of Object.entries(messagesOf(locale))) {
    groups[baseKey(key)] ??= new Set();
    for (const name of placeholdersOf(value)) groups[baseKey(key)].add(name);
  }
  return groups;
}

test('the default language exists and every language has a name and a valid Discord locale', () => {
  assert.ok(locales.includes(DEFAULT_LOCALE));
  const discordLocales = Object.values(Locale);
  for (const locale of locales) {
    assert.ok(discordLocales.includes(locale), `${locale} is not a Discord locale`);
    assert.ok(languages[locale], `${locale} has no meta.name`);
  }
});

test('every language has the same messages as the default one, with the same placeholders', () => {
  const reference = grouped(DEFAULT_LOCALE);
  for (const locale of locales.filter((name) => name !== DEFAULT_LOCALE)) {
    const own = grouped(locale);
    assert.deepEqual(Object.keys(own).sort(), Object.keys(reference).sort(), `${locale} has missing or extra messages`);
    for (const [key, placeholders] of Object.entries(reference)) {
      assert.deepEqual([...own[key]].sort(), [...placeholders].sort(), `${locale}: ${key} uses other placeholders`);
    }
  }
});

test('no message is empty, except the label of a custom status', () => {
  for (const locale of locales) {
    for (const [key, value] of Object.entries(messagesOf(locale))) {
      if (key === 'status.labels.custom') continue;
      assert.ok(
        [value].flat().every((text) => text.trim()),
        `${locale}: ${key} is empty`,
      );
    }
  }
});

test('every message the code asks for exists', () => {
  const namespaces = new Set(Object.keys(readLocale(DEFAULT_LOCALE)));
  const keys = new Set();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}${entry.name}`;
      if (entry.isDirectory()) {
        walk(`${path}/`);
      } else if (entry.name.endsWith('.js')) {
        for (const [, key] of readFileSync(path, 'utf8').matchAll(/'([a-zA-Z]+(?:\.[a-zA-Z0-9]+)+)'/g)) {
          // file names such as ship.gif are not messages
          if (namespaces.has(key.split('.')[0]) && !/\.(gif|png|jpe?g|json|js)$/.test(key)) keys.add(key);
        }
      }
    }
  };
  walk(srcDir);
  assert.ok(keys.size > 50, 'the scan found too few keys');

  // a group such as play.options.song is read by localize(), which takes its name and description
  const known = Object.keys(messagesOf(DEFAULT_LOCALE)).map(baseKey);
  for (const key of keys) {
    const exists = known.some((candidate) => candidate === key || candidate.startsWith(`${key}.`));
    assert.ok(exists, `${key} is used in the code but missing from ${DEFAULT_LOCALE}`);
  }
});

test('the messages built from a feature, setting, command or choice exist', async () => {
  const known = new Set(Object.keys(messagesOf(DEFAULT_LOCALE)).map(baseKey));
  const need = (key) => assert.ok(known.has(key), `${key} is missing`);

  for (const feature of Object.keys(features)) {
    need(`setup.features.${feature}.name`);
    need(`setup.features.${feature}.description`);
  }
  for (const [key, definition] of Object.entries(settingDefinitions)) {
    need(`setup.settings.${key}.label`);
    if (!definition.optional) need(`setup.settings.${key}.name`);
    if (definition.empty) need(`setup.settings.${key}.empty`);
  }
  const permissions = [...Object.values(settingDefinitions), ...Object.values(features)].flatMap((definition) => definition.needs ?? []);
  for (const name of new PermissionsBitField(permissions).toArray()) need(`setup.permissionNames.${name}`);
  for (const [name, command] of await loadCommands()) {
    need(`${name}.description`);
    need(`help.categories.${command.category}`);
  }
  for (const name of ['kiss', 'slap']) for (const part of ['texts', 'self', 'bot', 'done']) need(`${name}.${part}`);
  for (const activity of ['playing', 'watching', 'listening', 'competing', 'streaming', 'custom']) {
    need(`status.choices.${activity}`);
    need(`status.labels.${activity}`);
  }
  for (const min of [90, 70, 50, 30, 0]) need(`ship.tiers.${min}`);
  for (const type of ['playlist', 'album']) need(`play.types.${type}.name`);
});

test('every option a command reads is one it declares', async () => {
  for (const [name, command] of await loadCommands()) {
    const source = readFileSync(`${srcDir}commands/${name}.js`, 'utf8');
    const declared = (command.data.toJSON().options ?? []).map((option) => option.name);
    for (const [, option] of source.matchAll(/options\.get\w+\('([^']+)'/g)) {
      assert.ok(declared.includes(option), `/${name} reads the option "${option}", which it does not declare`);
    }
  }
});

test('every command and option is translated into every other language', async () => {
  const others = locales.filter((locale) => locale !== DEFAULT_LOCALE);
  for (const [name, command] of await loadCommands()) {
    const json = command.data.toJSON();
    for (const locale of others) {
      assert.ok(json.description_localizations?.[locale], `/${name} has no ${locale} description`);
      for (const option of json.options ?? []) {
        assert.ok(option.name_localizations?.[locale], `/${name} ${option.name} has no ${locale} name`);
        assert.ok(option.description_localizations?.[locale], `/${name} ${option.name} has no ${locale} description`);
      }
    }
  }
});

test('a message falls back to the default language, and a missing one is its own key', (context) => {
  context.mock.method(console, 'warn', () => {});
  assert.equal(t('xx-XX', 'common.error'), t(DEFAULT_LOCALE, 'common.error'), 'a language the bot does not have');
  assert.equal(t(DEFAULT_LOCALE, 'nothing.here'), 'nothing.here');
  assert.equal(t('pt-BR', 'common.error'), 'Desculpe! Ocorreu um erro..');
});

test('placeholders are filled in, and left alone when no value comes', () => {
  assert.equal(t(DEFAULT_LOCALE, 'skip.done', { title: 'Song' }), 'You skipped **Song**!');
  assert.equal(t(DEFAULT_LOCALE, 'skip.done'), 'You skipped **{title}**!');
});

test('a count picks the plural form of the language', () => {
  assert.equal(t(DEFAULT_LOCALE, 'play.songs', { count: 1 }), '1 song');
  assert.equal(t(DEFAULT_LOCALE, 'play.songs', { count: 3 }), '3 songs');
  assert.equal(t('pt-BR', 'queue.more', { count: 1 }), '…e mais 1 música');
  assert.equal(t('pt-BR', 'queue.more', { count: 4 }), '…e mais 4 músicas');
});

test('a list of messages gives one of its variants', () => {
  const variants = new Set(Array.from({ length: 200 }, () => t(DEFAULT_LOCALE, 'kiss.texts', { author: 'A', target: 'B' })));
  assert.ok(variants.size > 1, 'always the same one');
  for (const text of variants) assert.match(text, /A/);
});

test('Discord gets the translations of the languages other than the default', () => {
  assert.deepEqual(localizations('play.options.song.name'), { 'pt-BR': 'música-ou-playlist' });
  assert.deepEqual(localizations('nothing.here'), {});
});
