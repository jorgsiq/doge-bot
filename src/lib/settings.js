import { ChannelType, PermissionFlagsBits } from 'discord.js';
import config from '../config.js';
import { DEFAULT_LOCALE, languages, t } from './i18n.js';
import { ephemeral } from './replies.js';
import * as store from './store.js';

// guild id -> { welcomed, setupDone, features: { [feature]: boolean }, settings: { [key]: id | ids | text } }
const guilds = store.section('guilds');
const entry = (guildId) => (guilds[guildId] ??= { features: {}, settings: {} });

const TEXT = [ChannelType.GuildText, ChannelType.GuildAnnouncement];

const {
  AttachFiles,
  Connect,
  EmbedLinks,
  ManageChannels,
  ManageMessages,
  MentionEveryone,
  ManageRoles,
  MoveMembers,
  ReadMessageHistory,
  SendMessages,
  Speak,
  ViewChannel,
} = PermissionFlagsBits;
const POST = [ViewChannel, SendMessages, EmbedLinks];
const MODERATE = [...POST, ReadMessageHistory, ManageMessages];

export const settingDefinitions = {
  updatesChannel: { kind: 'channel', types: TEXT, needs: [...POST, AttachFiles] },
  alertsChannel: { kind: 'channel', types: TEXT, needs: POST },
  subscriberRole: { kind: 'role', optional: true },
  region: { kind: 'region', optional: true },
  shibaChannel: { kind: 'channel', types: TEXT, needs: POST },
  cleanupChannels: { kind: 'channel', types: TEXT, multiple: true, needs: MODERATE },
  roomCategory: {
    kind: 'channel',
    types: [ChannelType.GuildCategory],
    needs: [ViewChannel, ManageChannels, ManageRoles, MoveMembers, Connect],
  },
  commandsChannel: { kind: 'channel', types: TEXT, needs: MODERATE },
  // `empty`: left unset, each message shows up where its command was used (the label says so)
  musicChannel: { kind: 'channel', types: TEXT, optional: true, empty: true, needs: POST },
  funChannel: { kind: 'channel', types: TEXT, optional: true, empty: true, needs: POST },
};

export const features = {
  music: { emoji: '🎵', settings: ['musicChannel'], onByDefault: true, needs: [Connect, Speak] },
  fun: { emoji: '💬', settings: ['funChannel'], onByDefault: true },
  welcome: { emoji: '👋', settings: ['updatesChannel'] },
  rooms: { emoji: '👽', settings: ['roomCategory'] },
  gameAlerts: { emoji: '🎁', settings: ['alertsChannel', 'subscriberRole', 'region'], needs: [MentionEveryone] },
  shiba: { emoji: '🐕', settings: ['shibaChannel'] },
  cleanup: { emoji: '🧹', settings: ['cleanupChannels'] },
  commandsOnly: { emoji: '⌨️', settings: ['commandsChannel'] },
};

const hasValue = (value) => (Array.isArray(value) ? value.length > 0 : Boolean(value));

export function getSetting(guildId, key) {
  return guilds[guildId]?.settings[key] ?? null;
}

export async function setSetting(guildId, key, value) {
  entry(guildId).settings[key] = value;
  await store.save();
}

export function getLanguage(guildId) {
  const language = getSetting(guildId, 'language');
  return languages[language] ? language : DEFAULT_LOCALE;
}

export const guildT = (guildId) => (key, vars) => t(getLanguage(guildId), key, vars);

export function getRegion(guildId) {
  const region = getSetting(guildId, 'region');
  if (config.gameAlerts.regions.includes(region)) return region;
  return config.gameAlerts.regionByLanguage[getLanguage(guildId)] ?? config.gameAlerts.defaultRegion;
}

const regionNames = new Map();

export function regionName(language, region) {
  if (!regionNames.has(language)) regionNames.set(language, new Intl.DisplayNames(language, { type: 'region' }));
  return regionNames.get(language).of(region);
}

export const regionFlag = (region) => String.fromCodePoint(...[...region].map((letter) => 0x1f1a5 + letter.charCodeAt(0)));

// Servers set up before languages existed only had Portuguese, so they keep it
export function migrateLanguages(allGuilds, meta) {
  if (meta.languagesMigrated) return false;
  for (const { settings } of Object.values(allGuilds)) settings.language ??= 'pt-BR';
  meta.languagesMigrated = true;
  return true;
}

if (migrateLanguages(guilds, store.section('meta'))) store.save();

export function isSwitchedOn(guildId, feature) {
  return guilds[guildId]?.features[feature] ?? features[feature].onByDefault ?? false;
}

export async function setSwitchedOn(guildId, feature, on) {
  entry(guildId).features[feature] = on;
  await store.save();
}

export function missingSettings(guildId, feature) {
  return features[feature].settings.filter((key) => !settingDefinitions[key].optional && !hasValue(getSetting(guildId, key)));
}

export function isEnabled(guildId, feature) {
  return isSwitchedOn(guildId, feature) && missingSettings(guildId, feature).length === 0;
}

export const enabledGuilds = (client, feature) => [...client.guilds.cache.values()].filter((guild) => isEnabled(guild.id, feature));

export async function ensureEnabled(interaction, feature) {
  if (isEnabled(interaction.guildId, feature)) return true;
  if (interaction.isAutocomplete()) {
    await interaction.respond([]);
  } else {
    const translate = guildT(interaction.guildId);
    await interaction.reply(ephemeral(translate('common.featureDisabled', { feature: translate(`setup.features.${feature}.name`) })));
  }
  return false;
}

export const isSetupDone = (guildId) => Boolean(guilds[guildId]?.setupDone);

export async function markSetupDone(guildId) {
  entry(guildId).setupDone = true;
  await store.save();
}

// Servers that existed before the guided setup have nothing left to be guided through
export function migrateSetup(allGuilds, meta) {
  if (meta.setupMigrated) return false;
  for (const guild of Object.values(allGuilds)) guild.setupDone ??= true;
  meta.setupMigrated = true;
  return true;
}

if (migrateSetup(guilds, store.section('meta'))) store.save();

export function wasWelcomed(guildId) {
  return Boolean(guilds[guildId]?.welcomed);
}

export async function markWelcomed(guildId) {
  entry(guildId).welcomed = true;
  await store.save();
}

export function getRole(guild, key) {
  const id = getSetting(guild.id, key);
  return id ? guild.roles.cache.get(id) : undefined;
}

export function settingItems(guild, key) {
  if (settingDefinitions[key].kind === 'role') return [getRole(guild, key)].filter(Boolean);
  return [getSetting(guild.id, key)]
    .flat()
    .map((id) => guild.channels.cache.get(id))
    .filter(Boolean);
}
