import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  enabledGuilds,
  getLanguage,
  getRegion,
  guildT,
  migrateLanguages,
  migrateSetup,
  setSetting,
  setSwitchedOn,
} from '../src/lib/settings.js';

test('a server speaks English until it picks another language', async () => {
  assert.equal(getLanguage('new-server'), 'en-US');
  assert.equal(guildT('new-server')('common.error'), 'Sorry! Something went wrong..');

  await setSetting('picky-server', 'language', 'pt-BR');
  assert.equal(getLanguage('picky-server'), 'pt-BR');
  assert.equal(guildT('picky-server')('common.error'), 'Desculpe! Ocorreu um erro..');
});

test('a language the bot does not have falls back to English', async () => {
  await setSetting('odd-server', 'language', 'tlh');
  assert.equal(getLanguage('odd-server'), 'en-US');
});

test('the region of a server starts as the one of its language, until another is picked', async () => {
  assert.equal(getRegion('region-new-server'), 'US');

  await setSetting('region-brazilian-server', 'language', 'pt-BR');
  assert.equal(getRegion('region-brazilian-server'), 'BR');

  await setSetting('region-brazilian-server', 'region', 'PT');
  assert.equal(getRegion('region-brazilian-server'), 'PT');
  assert.equal(getLanguage('region-brazilian-server'), 'pt-BR', 'the language is its own choice');

  await setSetting('region-odd-server', 'region', 'XX');
  assert.equal(getRegion('region-odd-server'), 'US', 'a region the bot does not have falls back to the default');
});

test('servers set up before languages existed keep speaking Portuguese, once', () => {
  const guilds = { old: { settings: {} }, picked: { settings: { language: 'en-US' } } };
  const meta = {};

  assert.equal(migrateLanguages(guilds, meta), true);
  assert.equal(guilds.old.settings.language, 'pt-BR');
  assert.equal(guilds.picked.settings.language, 'en-US', 'a choice is never overwritten');

  guilds.later = { settings: {} };
  assert.equal(migrateLanguages(guilds, meta), false);
  assert.equal(guilds.later.settings.language, undefined, 'servers that came later start in English');
});

test('servers that existed before the guided setup skip it, once', () => {
  const guilds = { old: { settings: {} }, gone: { setupDone: false, settings: {} } };
  const meta = {};

  assert.equal(migrateSetup(guilds, meta), true);
  assert.equal(guilds.old.setupDone, true);
  assert.equal(guilds.gone.setupDone, false, 'a choice already made is kept');

  guilds.later = { settings: {} };
  assert.equal(migrateSetup(guilds, meta), false);
  assert.equal(guilds.later.setupDone, undefined, 'servers that came later are guided');
});

test('only the servers with the feature on are listed', async () => {
  await setSwitchedOn('on-server', 'music', true);
  await setSwitchedOn('off-server', 'music', false);
  const client = {
    guilds: {
      cache: new Map([
        ['on-server', { id: 'on-server' }],
        ['off-server', { id: 'off-server' }],
      ]),
    },
  };

  assert.deepEqual(
    enabledGuilds(client, 'music').map((guild) => guild.id),
    ['on-server'],
  );
});
