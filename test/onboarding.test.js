import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ChannelType, Collection, PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { sendSetupInvite } from '../src/lib/onboarding.js';
import { wasWelcomed } from '../src/lib/settings.js';

const { EmbedLinks, SendMessages, ViewChannel } = PermissionFlagsBits;

const textChannel = (id, allowed) => {
  const sent = [];
  return {
    id,
    sent,
    type: ChannelType.GuildText,
    rawPosition: 0,
    permissionsFor: () => new PermissionsBitField(allowed),
    send: async (payload) => void sent.push(payload),
  };
};

const guildOf = (id, channels) => {
  const dms = [];
  return {
    id,
    name: 'A Server',
    dms,
    members: { me: {} },
    systemChannel: null,
    channels: { cache: new Collection(channels.map((channel) => [channel.id, channel])) },
    fetchOwner: async () => ({ send: async (payload) => void dms.push(payload) }),
  };
};

const linksOf = (payload) =>
  payload.components.flatMap((row) => row.toJSON().components).map((component) => component.custom_id ?? component.url);

test('the welcome goes to the first channel the bot can write in, with the setup button and the legal links', async () => {
  const blocked = textChannel('blocked', [ViewChannel]);
  const open = textChannel('open', [ViewChannel, SendMessages, EmbedLinks]);
  const guild = guildOf('welcome-server', [blocked, open]);

  await sendSetupInvite(guild);

  assert.equal(blocked.sent.length, 0);
  assert.deepEqual(linksOf(open.sent[0]), [
    'setup:open',
    'https://github.com/jorgsiq/doge-bot/blob/master/TERMS.md',
    'https://github.com/jorgsiq/doge-bot/blob/master/PRIVACY.md',
  ]);
  assert.match(open.sent[0].embeds[0].data.description, /first the language, then my permissions/);
  assert.equal(wasWelcomed('welcome-server'), true);
});

test('with no channel to write in, the owner is told what to give the bot', async () => {
  const guild = guildOf('silent-server', [textChannel('blocked', [ViewChannel])]);

  await sendSetupInvite(guild);

  assert.equal(guild.dms.length, 1);
  assert.match(guild.dms[0].embeds[0].data.description, /I can't write in any of its channels/);
  assert.match(guild.dms[0].embeds[0].data.description, /Server Settings → Roles → Đoge Bot/);
  assert.equal(linksOf(guild.dms[0]).length, 2);
});
