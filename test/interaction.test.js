import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MessageFlags } from 'discord.js';
import { execute } from '../src/events/interactionCreate.js';

function fakeInteraction({ commands = [], kind = 'chat', commandName, customId, deferred = false, replied = false } = {}) {
  const calls = [];
  const record = (name) => async (payload) => void calls.push([name, payload]);
  return {
    calls,
    client: { commands: new Map(commands) },
    guildId: 'a-server',
    commandName,
    customId,
    deferred,
    replied,
    isMessageComponent: () => kind === 'component',
    isChatInputCommand: () => kind === 'chat',
    isAutocomplete: () => kind === 'autocomplete',
    isRepliable: () => true,
    reply: record('reply'),
    editReply: record('editReply'),
    followUp: record('followUp'),
  };
}

const quiet = (context) => context.mock.method(console, 'error', () => {});

test('an unknown command is answered privately', async () => {
  const interaction = fakeInteraction({ commandName: 'nothing' });
  await execute(interaction);

  assert.deepEqual(interaction.calls, [['reply', { content: "Sorry! I haven't learned that trick yet..", flags: MessageFlags.Ephemeral }]]);
});

test('a command of a feature that is off is not run', async () => {
  let ran = false;
  const interaction = fakeInteraction({
    commandName: 'room',
    commands: [['room', { feature: 'rooms', execute: () => void (ran = true) }]],
  });
  await execute(interaction);

  assert.equal(ran, false);
  assert.match(interaction.calls[0][1].content, /\*\*Temporary rooms\*\* feature is turned off/);
});

test('a button reaches its command with the arguments of its custom id', async () => {
  let received;
  const interaction = fakeInteraction({
    kind: 'component',
    customId: 'thing:one:two',
    commands: [['thing', { handleComponent: (_, ...args) => void (received = args) }]],
  });
  await execute(interaction);

  assert.deepEqual(received, ['one', 'two']);
});

test('a command that throws gets an error reply, whatever state its reply is in', async (context) => {
  quiet(context);
  const boom = [['boom', { execute: () => Promise.reject(new Error('boom')) }]];

  const fresh = fakeInteraction({ commandName: 'boom', commands: boom });
  await execute(fresh);
  assert.equal(fresh.calls[0][0], 'reply');
  assert.equal(fresh.calls[0][1].content, 'Sorry! Something went wrong..');
  assert.equal(fresh.calls[0][1].flags, MessageFlags.Ephemeral);

  const deferred = fakeInteraction({ commandName: 'boom', commands: boom, deferred: true });
  await execute(deferred);
  assert.deepEqual(deferred.calls, [['editReply', 'Sorry! Something went wrong..']], 'it replaces the "thinking..."');

  const replied = fakeInteraction({ commandName: 'boom', commands: boom, replied: true });
  await execute(replied);
  assert.equal(replied.calls[0][0], 'followUp');
});
