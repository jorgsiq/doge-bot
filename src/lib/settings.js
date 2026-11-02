import { ChannelType, MessageFlags } from 'discord.js';
import * as store from './store.js';

// guild id -> { welcomed, features: { [feature]: boolean }, settings: { [key]: id | ids | text } }
const guilds = store.section('guilds');
const entry = (guildId) => (guilds[guildId] ??= { features: {}, settings: {} });

const TEXT = [ChannelType.GuildText, ChannelType.GuildAnnouncement];

// Everything an admin can pick in /setup
export const settingDefinitions = {
  updatesChannel: { kind: 'channel', types: TEXT, label: 'Canal dos registros' },
  alertsChannel: { kind: 'channel', types: TEXT, label: 'Canal dos alertas' },
  subscriberRole: { kind: 'role', label: 'Cargo mencionado nos alertas (opcional)', optional: true },
  shibaChannel: { kind: 'channel', types: TEXT, label: 'Canal do shiba do dia' },
  cleanupChannels: { kind: 'channel', types: TEXT, multiple: true, label: 'Canais com limpeza diária' },
  roomCategory: { kind: 'channel', types: [ChannelType.GuildCategory], label: 'Categoria onde as salas são criadas' },
  commandsChannel: { kind: 'channel', types: TEXT, label: 'Canal de comandos' },
};

// Each feature can be switched on and off per server; it only runs once its settings are filled in
export const features = {
  music: { emoji: '🎵', name: 'Música', description: 'Player com fila no canal de voz: /play, /queue, /skip e companhia.', settings: [], onByDefault: true },
  welcome: { emoji: '👋', name: 'Boas-vindas e registros', description: 'Anuncia quem entra e sai e registra mudanças de apelido e foto.', settings: ['updatesChannel'] },
  rooms: { emoji: '👽', name: 'Salas temporárias', description: 'Com /room cada membro cria uma sala de voz privada, que some quando esvazia.', settings: ['roomCategory'] },
  gameAlerts: { emoji: '🎁', name: 'Alertas de jogos', description: 'Jogos grátis e promoções relevantes (Epic, Steam...), filtrados para não virar spam. Os membros pegam o cargo mencionado em Canais e Cargos, no próprio Discord.', settings: ['alertsChannel', 'subscriberRole'] },
  shiba: { emoji: '🐕', name: 'Shiba do dia', description: 'Todo dia às 09:00 (Brasília) posta a foto de um shiba diferente no canal escolhido.', settings: ['shibaChannel'] },
  cleanup: { emoji: '🧹', name: 'Limpeza diária', description: 'Apaga todas as mensagens dos canais escolhidos todo dia às 06:00 (Brasília).', settings: ['cleanupChannels'] },
  commandsOnly: { emoji: '⌨️', name: 'Canal de comandos', description: 'No canal escolhido, apaga na hora toda mensagem que não seja comando, inclusive da staff.', settings: ['commandsChannel'] },
};

const hasValue = (value) => (Array.isArray(value) ? value.length > 0 : Boolean(value));

export function getSetting(guildId, key) {
  return guilds[guildId]?.settings[key] ?? null;
}

export async function setSetting(guildId, key, value) {
  entry(guildId).settings[key] = value;
  await store.save();
}

export function isSwitchedOn(guildId, feature) {
  return guilds[guildId]?.features[feature] ?? features[feature].onByDefault ?? false;
}

export async function setSwitchedOn(guildId, feature, on) {
  entry(guildId).features[feature] = on;
  await store.save();
}

// Keys of the required settings that are still empty
export function missingSettings(guildId, feature) {
  return features[feature].settings.filter((key) => !settingDefinitions[key].optional && !hasValue(getSetting(guildId, key)));
}

export function isEnabled(guildId, feature) {
  return isSwitchedOn(guildId, feature) && missingSettings(guildId, feature).length === 0;
}

// Replies and returns false when the feature is off in this server
export async function ensureEnabled(interaction, feature) {
  if (isEnabled(interaction.guildId, feature)) return true;
  if (interaction.isAutocomplete()) await interaction.respond([]);
  else await interaction.reply({ content: `Opa! a função **${features[feature].name}** está desativada neste servidor..`, flags: MessageFlags.Ephemeral });
  return false;
}

// The setup invitation is posted once per server
export function wasWelcomed(guildId) {
  return Boolean(guilds[guildId]?.welcomed);
}

export async function markWelcomed(guildId) {
  entry(guildId).welcomed = true;
  await store.save();
}

// roles are only mentioned, never handed out: members get them through Discord itself
export function getRole(guild, key) {
  const id = getSetting(guild.id, key);
  return id ? guild.roles.cache.get(id) : undefined;
}
