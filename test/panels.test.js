import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MessageFlags, PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { execute as about } from '../src/commands/about.js';
import { execute as help } from '../src/commands/help.js';
import { execute as setup, handleComponent, hubPanel } from '../src/commands/setup.js';
import { loadCommands } from '../src/lib/commands.js';
import { getRegion, isSetupDone, setSetting, setSwitchedOn } from '../src/lib/settings.js';

const everything = new PermissionsBitField(PermissionsBitField.All).remove(PermissionFlagsBits.Administrator);

const guildOf = (id, { channels = [], permissions = everything } = {}) => ({
  id,
  name: 'A Server',
  channels: { cache: new Map(channels.map((channel) => [channel.id, channel])) },
  roles: { cache: new Map() },
  members: { me: { permissions } },
});

const channelOf = (id, permissions) => ({ id, toString: () => `<#${id}>`, permissionsFor: () => permissions });

const fakeInteraction = (guild, { permitted = true, values = [] } = {}) => {
  const calls = [];
  const record = (name) => async (payload) => void calls.push([name, payload]);
  return {
    calls,
    guild,
    values,
    memberPermissions: { has: () => permitted },
    reply: record('reply'),
    update: record('update'),
  };
};

const titleOf = ([, payload]) => payload.embeds[0].data.title;
const buttonsOf = ([, payload]) =>
  payload.components.flatMap((row) => row.toJSON().components).map((component) => component.custom_id ?? component.url);

test('the setup hub lists every feature and offers every language, with the current one selected', async () => {
  const guild = guildOf('panel-english');
  const [features, language] = hubPanel(guild).components.map((row) => row.toJSON());

  assert.equal(features.components[0].custom_id, 'setup:feature');
  assert.equal(features.components[0].options.length, 8);
  assert.equal(language.components[0].custom_id, 'setup:language');
  assert.deepEqual(
    language.components[0].options.map(({ value, default: selected }) => [value, Boolean(selected)]),
    [
      ['en-US', true],
      ['pt-BR', false],
    ],
  );
  assert.equal(hubPanel(guild).embeds[0].data.title, '⚙️ Đoge Bot setup');

  await setSetting('panel-portuguese', 'language', 'pt-BR');
  const portuguese = hubPanel(guildOf('panel-portuguese'));
  assert.equal(portuguese.embeds[0].data.title, '⚙️ Configuração do Đoge Bot');
  const options = portuguese.components[1].toJSON().components[0].options;
  assert.deepEqual(
    options.map(({ value, default: selected }) => [value, Boolean(selected)]),
    [
      ['en-US', false],
      ['pt-BR', true],
    ],
  );
});

test('the game alerts panel asks for the region, filled with the current one, and saves the pick', async () => {
  const guild = guildOf('region-panel');
  const open = fakeInteraction(guild, { values: ['gameAlerts'] });
  await handleComponent(open, 'feature');

  const [panel] = open.calls[0].slice(1);
  const region = panel.components.map((row) => row.toJSON().components[0]).find((menu) => menu.custom_id === 'setup:set:region');
  assert.equal(region.options.length, 12);
  assert.deepEqual(
    region.options.filter((option) => option.default).map((option) => option.value),
    ['US'],
  );
  assert.deepEqual([region.options[0].label, region.options[0].value, region.options[0].emoji.name], ['Brazil', 'BR', '🇧🇷']);
  assert.equal(region.min_values, 1);
  assert.equal(panel.embeds[0].data.fields.find((field) => field.name === 'Region of the prices and offers').value, '🇺🇸 United States');

  const pick = fakeInteraction(guild, { values: ['PT'] });
  await handleComponent(pick, 'set', 'region');
  const saved = pick.calls[0][1].embeds[0].data;
  assert.equal(saved.fields.find((field) => field.name === 'Region of the prices and offers').value, '🇵🇹 Portugal');
  assert.equal(saved.footer.text, '✅ Saved');

  const odd = fakeInteraction(guild, { values: ['XX'] });
  await handleComponent(odd, 'set', 'region');
  assert.equal(odd.calls.length, 0, 'a region that is not offered is ignored');
  assert.equal(getRegion(guild.id), 'PT');
});

test('the help lists the commands of the member in the language of the server', async () => {
  const commands = await loadCommands();
  const run = async (guildId) => {
    const replies = [];
    await help({
      guildId,
      guild: { name: 'A Server' },
      user: { username: 'ana' },
      memberPermissions: { has: () => false },
      client: { commands, application: { commands: { cache: { find: () => undefined } } } },
      reply: async (payload) => void replies.push(payload),
    });
    return replies[0];
  };

  const english = await run('help-english');
  assert.equal(english.flags, MessageFlags.Ephemeral);
  assert.equal(english.embeds[0].data.title, 'Hello, @ana!');
  const englishFields = english.embeds[0].data.fields;
  assert.deepEqual(
    englishFields.map((field) => field.name),
    ['Info', 'Fun', 'Music Player'],
    'rooms are off by default and admin commands are for staff',
  );
  assert.match(englishFields[1].value, /\*\*\/pet\*\* — Pet the Đoge/);

  await setSetting('help-portuguese', 'language', 'pt-BR');
  const portuguese = await run('help-portuguese');
  assert.equal(portuguese.embeds[0].data.title, 'Olá, @ana!');
  assert.match(portuguese.embeds[0].data.fields[1].value, /\*\*\/pet\*\* — Você faz carinho no Đoge/);
});

test('a server that was never set up is walked through the language, the permissions and the features, once', async () => {
  const guild = guildOf('wizard-server');
  const opened = fakeInteraction(guild);
  await setup(opened);
  assert.equal(titleOf(opened.calls[0]), 'Step 1 of 3 · Language');
  assert.equal(opened.calls[0][1].flags, MessageFlags.Ephemeral);
  assert.deepEqual(buttonsOf(opened.calls[0]), ['setup:language:step', 'setup:permissions']);
  assert.equal(isSetupDone(guild.id), false);

  const chosen = fakeInteraction(guild, { values: ['pt-BR'] });
  await handleComponent(chosen, 'language', 'step');
  assert.equal(titleOf(chosen.calls[0]), 'Passo 1 de 3 · Idioma', 'the step comes back in the language just picked');

  const permissions = fakeInteraction(guild);
  await handleComponent(permissions, 'permissions');
  assert.equal(titleOf(permissions.calls[0]), 'Passo 2 de 3 · Permissões');
  assert.deepEqual(buttonsOf(permissions.calls[0]), ['setup:permissions', 'setup:hub']);
  assert.match(permissions.calls[0][1].embeds[0].data.description, /Tenho todas as permissões/);

  const features = fakeInteraction(guild);
  await handleComponent(features, 'hub');
  assert.equal(titleOf(features.calls[0]), 'Passo 3 de 3 · Funções');
  assert.equal(isSetupDone(guild.id), true);

  const again = fakeInteraction(guild);
  await setup(again);
  assert.equal(titleOf(again.calls[0]), '⚙️ Configuração do Đoge Bot', 'later it opens the hub straight away');
});

test('the permissions step lists what the role lacks and which features need it', async () => {
  const lacking = new PermissionsBitField(everything).remove(PermissionFlagsBits.ManageMessages);
  const interaction = fakeInteraction(guildOf('poor-role-server', { permissions: lacking }));
  await handleComponent(interaction, 'permissions');

  const description = interaction.calls[0][1].embeds[0].data.description;
  assert.match(description, /\*\*Manage Messages\*\* — Daily cleanup, Commands channel/);
  assert.match(description, /Server Settings → Roles → Đoge Bot/);
  assert.doesNotMatch(description, /Manage Channels/);
});

test('a channel the bot cannot write in is flagged in its feature and in the hub', async () => {
  const blocked = new PermissionsBitField(everything).remove(PermissionFlagsBits.SendMessages);
  const guild = guildOf('blocked-server', { channels: [channelOf('alerts', blocked)] });
  await setSetting(guild.id, 'alertsChannel', 'alerts');
  await setSwitchedOn(guild.id, 'gameAlerts', true);

  const hub = hubPanel(guild).embeds[0].data.fields;
  assert.equal(hub[1].value.split('\n')[4], 'Needs permissions');

  const interaction = fakeInteraction(guild, { values: ['gameAlerts'] });
  await handleComponent(interaction, 'feature');
  const field = interaction.calls[0][1].embeds[0].data.fields.find((candidate) => candidate.name === 'Missing permissions');
  assert.match(field.value, /<#alerts> — Send Messages/);
});

test('the setup, the about and the welcome link the terms and the privacy policy in the language of the server', async () => {
  const guild = guildOf('legal-server');
  const english = fakeInteraction(guild);
  english.guildId = guild.id;
  english.client = { readyAt: new Date(), ws: { ping: 1 } };
  await about(english);
  assert.deepEqual(buttonsOf(english.calls[0]), [
    'https://github.com/jorgsiq/doge-bot/blob/master/TERMS.md',
    'https://github.com/jorgsiq/doge-bot/blob/master/PRIVACY.md',
  ]);

  await setSetting(guild.id, 'language', 'pt-BR');
  const portuguese = fakeInteraction(guild);
  portuguese.guildId = guild.id;
  portuguese.client = english.client;
  await about(portuguese);
  assert.deepEqual(buttonsOf(portuguese.calls[0]), [
    'https://github.com/jorgsiq/doge-bot/blob/master/TERMS.pt-BR.md',
    'https://github.com/jorgsiq/doge-bot/blob/master/PRIVACY.pt-BR.md',
  ]);
});

test('the setup is for who manages the server only', async () => {
  const interaction = fakeInteraction(guildOf('guarded-server'), { permitted: false });
  interaction.guild.id = 'guarded-server';
  await handleComponent(interaction, 'permissions');
  assert.equal(interaction.calls[0][0], 'reply');
  assert.match(interaction.calls[0][1].content, /Manage Server/);
});
