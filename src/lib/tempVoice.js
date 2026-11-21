import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  OverwriteType,
  PermissionFlagsBits,
  PermissionsBitField,
} from 'discord.js';
import config from '../config.js';
import { getSetting, guildT } from './settings.js';
import * as store from './store.js';

const rooms = store.section('tempVoiceRooms');

// Discord allows renaming a channel only twice every 10 minutes
const RENAME_WINDOW = 10 * 60_000;
const renames = new Map();

export const UNCLAIMED_ROOM_MINUTES = 2;

const { Connect, MoveMembers, ViewChannel } = PermissionFlagsBits;
// MoveMembers lets the owner disconnect people from their own room
const OWNER_PERMISSIONS = { ViewChannel: true, Connect: true, MoveMembers: true };

export function getRoom(channelId) {
  return rooms[channelId];
}

export async function handleVoiceStateUpdate(oldState, newState) {
  if (oldState.channelId === newState.channelId || !rooms[oldState.channelId]) return;
  await closeIfEmpty(oldState.client, oldState.channelId);
}

export async function cleanupRooms(client) {
  for (const channelId of Object.keys(rooms)) await closeIfEmpty(client, channelId);
}

async function closeIfEmpty(client, channelId) {
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (channel?.members.size) return;

  await channel
    ?.delete(guildT(channel.guildId)('tempVoice.reason.empty'))
    .catch((error) => console.error('Failed to delete a temporary room:', error));
  delete rooms[channelId];
  await store.save();
}

// Two quick /room from the same member share one run, so they can't create two rooms
const opening = new Map();

export function openRoom(member, name) {
  const key = `${member.guild.id}:${member.id}`;
  if (!opening.has(key)) {
    opening.set(
      key,
      createOrFindRoom(member, name).finally(() => opening.delete(key)),
    );
  }
  return opening.get(key);
}

async function createOrFindRoom(member, name) {
  const { guild } = member;
  const t = guildT(guild.id);
  const ownedId = Object.keys(rooms).find((id) => rooms[id].ownerId === member.id && guild.channels.cache.has(id));
  let channel = ownedId && guild.channels.cache.get(ownedId);
  const created = !channel;

  if (created) {
    const category = guild.channels.cache.get(getSetting(guild.id, 'roomCategory'));
    const owner = { id: member.id, type: OverwriteType.Member, allow: [ViewChannel, Connect, MoveMembers], deny: [] };
    channel = await guild.channels.create({
      name: (name || t('room.defaultName', { name: member.displayName })).slice(0, 100),
      type: ChannelType.GuildVoice,
      parent: category?.id,
      permissionOverwrites: roomOverwrites(guild, category, [owner], true),
      reason: t('tempVoice.reason.created', { user: member.user.tag }),
    });
    rooms[channel.id] = { ownerId: member.id, hidden: true };
    await store.save();
    await channel.send(roomPanel(t, member.id)).catch((error) => console.error('Failed to send the room panel:', error));
    setTimeout(() => closeIfEmpty(member.client, channel.id), UNCLAIMED_ROOM_MINUTES * 60_000);
  }

  const moved =
    Boolean(member.voice.channel) &&
    (await member.voice.setChannel(channel).then(
      () => true,
      () => false,
    ));
  return { channel, created, moved };
}

// Limited to permissions the bot has: Discord fails the whole room otherwise, and Manage Permissions needs an administrator
function categoryOverwrites(category) {
  if (!category) return [];
  const me = category.guild.members.me;
  let settable;
  if (me.permissions.has(PermissionFlagsBits.Administrator)) settable = PermissionsBitField.All;
  else settable = new PermissionsBitField(category.permissionsFor(me)).remove(PermissionFlagsBits.ManageRoles).bitfield;

  return category.permissionOverwrites.cache.map(({ id, type, allow, deny }) => ({
    id,
    type,
    allow: allow.bitfield & settable,
    deny: deny.bitfield & settable,
  }));
}

// Hidden denies every role; overwrites let in the listed members and the bot, which must see the room. Shown follows the category
export function roomOverwrites(guild, category, members, hidden) {
  const roles = categoryOverwrites(category).filter((overwrite) => overwrite.type === OverwriteType.Role);
  if (!hidden) return [...roles, ...members];

  const everyoneId = guild.roles.everyone.id;
  if (!roles.some((overwrite) => overwrite.id === everyoneId)) {
    roles.push({ id: everyoneId, type: OverwriteType.Role, allow: 0n, deny: 0n });
  }
  const hiddenRoles = roles.map((overwrite) => ({
    ...overwrite,
    allow: new PermissionsBitField(overwrite.allow).remove(ViewChannel, Connect),
    deny: new PermissionsBitField(overwrite.deny).add(ViewChannel, Connect),
  }));
  const botId = guild.members.me.id;
  let bot;
  if (members.some((overwrite) => overwrite.id === botId)) bot = [];
  else bot = [{ id: botId, type: OverwriteType.Member, allow: [ViewChannel, Connect], deny: [] }];
  return [...hiddenRoles, ...members, ...bot];
}

export async function setHidden(channel, hidden) {
  const members = channel.permissionOverwrites.cache
    .filter((overwrite) => overwrite.type === OverwriteType.Member)
    .map(({ id, type, allow, deny }) => ({ id, type, allow, deny }));
  if (hidden) {
    for (const id of channel.members.keys()) {
      if (!members.some((overwrite) => overwrite.id === id)) {
        members.push({ id, type: OverwriteType.Member, allow: [ViewChannel, Connect], deny: [] });
      }
    }
  }

  await channel.permissionOverwrites.set(roomOverwrites(channel.guild, channel.parent, members, hidden));
  rooms[channel.id].hidden = hidden;
  await store.save();
}

// A bot can't send Discord's own voice invite, so each user gets a DM with a button; returns who the DM couldn't reach
export async function invite(channel, users, inviter) {
  const unreachable = [];
  for (const user of users) {
    await channel.permissionOverwrites.edit(user.id, { ViewChannel: true, Connect: true });
    if (user.bot || user.id === inviter.id || channel.members.has(user.id)) continue;
    await user.send(inviteMessage(channel, inviter)).catch(() => unreachable.push(user));
  }
  return unreachable;
}

function inviteMessage(channel, inviter) {
  const t = guildT(channel.guild.id);
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(config.colors.doge)
        .setAuthor({ name: t('tempVoice.inviteMessage.title') })
        .setDescription(
          t('tempVoice.inviteMessage.description', { inviter: inviter.displayName, room: channel.name, server: channel.guild.name }),
        )
        .setThumbnail(channel.guild.iconURL()),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(t('tempVoice.inviteMessage.button')).setURL(channel.url),
      ),
    ],
  };
}

export async function rename(channel, name) {
  const recent = (renames.get(channel.id) ?? []).filter((at) => Date.now() - at < RENAME_WINDOW);
  if (recent.length >= 2) return false;

  renames.set(channel.id, [...recent, Date.now()]);
  await channel.setName(name);
  return true;
}

export async function transferOwnership(channel, newOwner) {
  const room = rooms[channel.id];
  await channel.permissionOverwrites.edit(room.ownerId, { MoveMembers: null }).catch(() => {});
  await channel.permissionOverwrites.edit(newOwner.id, OWNER_PERMISSIONS);
  room.ownerId = newOwner.id;
  await store.save();
}

export function roomPanel(t, ownerId) {
  const button = (action, emoji, style = ButtonStyle.Secondary) =>
    new ButtonBuilder()
      .setCustomId(`room:${action}`)
      .setLabel(t(`tempVoice.panel.${action}`))
      .setEmoji(emoji)
      .setStyle(style);

  return {
    embeds: [
      new EmbedBuilder()
        .setColor(config.colors.doge)
        .setTitle(t('tempVoice.panel.title'))
        .setDescription(t('tempVoice.panel.description', { owner: ownerId })),
    ],
    components: [
      new ActionRowBuilder().addComponents(button('rename', '✏️'), button('limit', '👥'), button('invite', '➕')),
      new ActionRowBuilder().addComponents(button('unlock', '🔓'), button('lock', '🔒'), button('claim', '👑', ButtonStyle.Primary)),
    ],
    allowedMentions: { parse: [] },
  };
}
