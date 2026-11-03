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
import { getSetting } from './settings.js';
import * as store from './store.js';

// channel id -> { ownerId, hidden }
const rooms = store.section('tempVoiceRooms');

// Discord allows renaming a channel only twice every 10 minutes
const RENAME_WINDOW = 10 * 60_000;
const renames = new Map();

// a room whose owner wasn't in a voice channel (so couldn't be moved) is deleted if nobody joins in time
export const UNCLAIMED_ROOM_MINUTES = 2;

const { Connect, MoveMembers, ViewChannel } = PermissionFlagsBits;
// MoveMembers lets the owner disconnect people from their own room
const OWNER_PERMISSIONS = { ViewChannel: true, Connect: true, MoveMembers: true };

export function getRoom(channelId) {
  return rooms[channelId];
}

// rooms close once the last member leaves, even after the feature is turned off
export async function handleVoiceStateUpdate(oldState, newState) {
  if (oldState.channelId === newState.channelId || !rooms[oldState.channelId]) return;
  await closeIfEmpty(oldState.client, oldState.channelId);
}

// Rooms left empty while the bot was offline, in every server
export async function cleanupRooms(client) {
  for (const channelId of Object.keys(rooms)) await closeIfEmpty(client, channelId);
}

async function closeIfEmpty(client, channelId) {
  // gone, or in a server the bot has left
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (channel?.members.size) return;

  await channel?.delete('Sala temporária vazia').catch((error) => console.error('Failed to delete a temporary room:', error));
  delete rooms[channelId];
  await store.save();
}

// Creates the member's room in the category picked in /setup (or finds the one they already own in this server),
// then moves them into it. Bots can only move members who are already in a voice channel.
export async function openRoom(member, name) {
  const { guild } = member;
  // rooms are kept for every server together
  const ownedId = Object.keys(rooms).find((id) => rooms[id].ownerId === member.id && guild.channels.cache.has(id));
  let channel = ownedId && guild.channels.cache.get(ownedId);
  const created = !channel;

  if (created) {
    const category = guild.channels.cache.get(getSetting(guild.id, 'roomCategory'));
    const owner = { id: member.id, type: OverwriteType.Member, allow: [ViewChannel, Connect, MoveMembers], deny: [] };
    // rooms start hidden: the owner opens them to everyone with the panel
    channel = await guild.channels.create({
      name: (name || `👽 Sala de ${member.displayName}`).slice(0, 100),
      type: ChannelType.GuildVoice,
      parent: category?.id,
      permissionOverwrites: roomOverwrites(guild, category, [owner], true),
      reason: `Sala temporária de ${member.user.tag}`,
    });
    rooms[channel.id] = { ownerId: member.id, hidden: true };
    await store.save();
    await channel.send(roomPanel(member.id)).catch((error) => console.error('Failed to send the room panel:', error));
    setTimeout(() => closeIfEmpty(member.client, channel.id), UNCLAIMED_ROOM_MINUTES * 60_000);
  }

  // they may have left voice in the meantime
  const moved = Boolean(member.voice.channel) && (await member.voice.setChannel(channel).then(() => true, () => false));
  return { channel, created, moved };
}

// The category's overwrites, limited to what the bot may set: Discord refuses (and the whole room fails)
// if a bot allows or denies a permission it lacks, and only administrators can set Manage Permissions
function categoryOverwrites(category) {
  if (!category) return [];
  const me = category.guild.members.me;
  const settable = me.permissions.has(PermissionFlagsBits.Administrator)
    ? PermissionsBitField.All
    : new PermissionsBitField(category.permissionsFor(me)).remove(PermissionFlagsBits.ManageRoles).bitfield;

  return category.permissionOverwrites.cache.map(({ id, type, allow, deny }) => ({
    id,
    type,
    allow: allow.bitfield & settable,
    deny: deny.bitfield & settable,
  }));
}

// Hiding denies every role seeing and joining the room, while member overwrites let in the members listed
// (owner, invited, whoever is inside) and the bot, which must see the room to manage it and play music in it.
// Shown, the room simply follows its category.
function roomOverwrites(guild, category, members, hidden) {
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
  const bot = members.some((overwrite) => overwrite.id === botId)
    ? []
    : [{ id: botId, type: OverwriteType.Member, allow: [ViewChannel, Connect], deny: [] }];
  return [...hiddenRoles, ...members, ...bot];
}

export async function setHidden(channel, hidden) {
  const members = channel.permissionOverwrites.cache
    .filter((overwrite) => overwrite.type === OverwriteType.Member)
    .map(({ id, type, allow, deny }) => ({ id, type, allow, deny }));
  // whoever is inside can still see the room and come back
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

// Lets the users in, and since a bot can't send Discord's own voice invite, sends each a DM with a button to the room.
// Returns the users the DM couldn't reach (DMs from server members turned off).
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
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(config.colors.doge)
        .setAuthor({ name: 'Convite para Sala' })
        .setDescription(`**${inviter.displayName}** te convidou para a sala **${channel.name}** no servidor **${channel.guild.name}**`)
        .setThumbnail(channel.guild.iconURL()),
    ],
    // a link to the channel opens it inside Discord
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Entrar na Sala').setURL(channel.url),
      ),
    ],
  };
}

// Returns false while Discord's rename limit is in effect
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

export function roomPanel(ownerId) {
  const button = (action, label, emoji, style = ButtonStyle.Secondary) =>
    new ButtonBuilder().setCustomId(`room:${action}`).setLabel(label).setEmoji(emoji).setStyle(style);

  return {
    embeds: [
      new EmbedBuilder()
        .setColor(config.colors.doge)
        .setTitle('Sala Temporária')
        .setDescription(
          `<@${ownerId}> é o dono desta sala.\n\nA sala começa fechada: só aparece para quem está nela ou foi convidado. Use **Abrir** para todo mundo ver e entrar.\n\nUse os botões abaixo para controlar a sala em que você está. Ela é apagada automaticamente quando todos saírem.`,
        ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        button('rename', 'Renomear', '✏️'),
        button('limit', 'Limite', '👥'),
        button('invite', 'Convidar', '➕'),
      ),
      new ActionRowBuilder().addComponents(
        button('unlock', 'Abrir', '🔓'),
        button('lock', 'Fechar', '🔒'),
        button('claim', 'Reivindicar', '👑', ButtonStyle.Primary),
      ),
    ],
    allowedMentions: { parse: [] },
  };
}
