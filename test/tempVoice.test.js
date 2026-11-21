import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Collection, OverwriteType, PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { roomOverwrites } from '../src/lib/tempVoice.js';

const { Connect, ViewChannel } = PermissionFlagsBits;

const guild = {
  roles: { everyone: { id: 'everyone' } },
  members: { me: { id: 'bot', permissions: new PermissionsBitField(PermissionsBitField.All) } },
};
const owner = { id: 'owner', type: OverwriteType.Member, allow: [ViewChannel, Connect], deny: [] };

const has = (permissions, permission) => new PermissionsBitField(permissions).has(permission);
const overwriteOf = (overwrites, id) => overwrites.find((overwrite) => overwrite.id === id);

const category = (...roles) => ({
  guild,
  permissionOverwrites: {
    cache: new Collection(
      roles.map(({ id, allow = 0n, deny = 0n }) => [
        id,
        { id, type: OverwriteType.Role, allow: new PermissionsBitField(allow), deny: new PermissionsBitField(deny) },
      ]),
    ),
  },
});

test('a hidden room denies everyone seeing and joining it, but lets the owner and the bot in', () => {
  const overwrites = roomOverwrites(guild, null, [owner], true);

  const everyone = overwriteOf(overwrites, 'everyone');
  assert.ok(has(everyone.deny, ViewChannel) && has(everyone.deny, Connect));
  assert.equal(overwriteOf(overwrites, 'owner'), owner);
  const bot = overwriteOf(overwrites, 'bot');
  assert.deepEqual(bot.allow, [ViewChannel, Connect], 'the bot must see the room to play music in it');
});

test('hiding a room also hides it from the roles its category lets in', () => {
  const overwrites = roomOverwrites(
    guild,
    category({ id: 'everyone', allow: ViewChannel }, { id: 'members', allow: ViewChannel }),
    [owner],
    true,
  );

  for (const id of ['everyone', 'members']) {
    const overwrite = overwriteOf(overwrites, id);
    assert.ok(!has(overwrite.allow, ViewChannel), `${id} no longer allows seeing`);
    assert.ok(has(overwrite.deny, ViewChannel) && has(overwrite.deny, Connect), `${id} is denied`);
  }
});

test('an open room follows its category and only adds the members listed', () => {
  const overwrites = roomOverwrites(guild, category({ id: 'members', allow: ViewChannel }), [owner], false);

  assert.deepEqual(
    overwrites.map((overwrite) => overwrite.id),
    ['members', 'owner'],
  );
  assert.ok(has(overwriteOf(overwrites, 'members').allow, ViewChannel), 'the category is kept as it is');
});

test('a member already listed is not added twice as the bot', () => {
  const bot = { id: 'bot', type: OverwriteType.Member, allow: [ViewChannel, Connect], deny: [] };
  const overwrites = roomOverwrites(guild, null, [owner, bot], true);

  assert.equal(overwrites.filter((overwrite) => overwrite.id === 'bot').length, 1);
});
