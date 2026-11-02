import { EmbedBuilder, TimestampStyles, time } from 'discord.js';
import config from '../config.js';
import { fetchEpicFreeGames, fetchOtherFreeGames, fetchSteamDeals, withBrazilianPrices } from './games.js';
import { everyDayAt } from './schedule.js';
import { getRole, getSetting, isEnabled } from './settings.js';
import * as store from './store.js';

// guild id -> key -> { price, at }: what each server already got, so nothing repeats there
const posted = store.section('postedGameAlerts');
const DAY = 24 * 60 * 60_000;
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact' });

function isNew(guildId, item) {
  const last = posted[guildId]?.[item.key];
  if (!last) return true;
  return Date.now() - last.at > config.gameAlerts.repostAfterDays * DAY || item.price < last.price;
}

async function markPosted(guildId, items) {
  const guildPosted = (posted[guildId] ??= {});
  for (const item of items) guildPosted[item.key] = { price: item.price ?? 0, at: Date.now() };
  await store.save();
}

const alertGuilds = (client) => [...client.guilds.cache.values()].filter((guild) => isEnabled(guild.id, 'gameAlerts'));

async function publish(guild, title, embeds) {
  const channel = await guild.channels.fetch(getSetting(guild.id, 'alertsChannel'));
  // without a subscriber role the alert still goes out, just without a ping
  const role = getRole(guild, 'subscriberRole');
  await channel.send({ content: role ? `${role} ${title}` : title, embeds, allowedMentions: { roles: role ? [role.id] : [] } });
}

// The stores are queried once; then every server gets what it hasn't seen yet. Returns what was posted, by server id.
async function postToEachServer(guilds, items, limit, title, toEmbed) {
  const result = {};
  for (const guild of guilds) {
    const fresh = items.filter((item) => isNew(guild.id, item)).slice(0, limit);
    if (!fresh.length) continue;
    try {
      await publish(guild, title, fresh.map(toEmbed));
      await markPosted(guild.id, fresh);
      result[guild.id] = fresh;
    } catch (error) {
      // a server with a deleted channel or missing permission must not stop the others
      console.error(`Failed to post game alerts in ${guild.name}:`, error);
    }
  }
  return result;
}

function freeGameEmbed(game) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setAuthor({ name: `Grátis na ${game.store}` })
    .setTitle(game.title)
    .setURL(game.url)
    .setImage(game.image ?? null)
    .addFields({ name: 'Preço', value: game.normalPrice ? `~~${game.normalPrice}~~ **Grátis**` : '**Grátis**', inline: true });

  if (game.endsAt) embed.addFields({ name: 'Resgate até', value: time(game.endsAt, TimestampStyles.LongDateShortTime), inline: true });
  if (game.description) embed.setDescription(game.description.length > 200 ? `${game.description.slice(0, 199)}…` : game.description);
  return embed;
}

function dealEmbed(deal) {
  return new EmbedBuilder()
    .setColor(config.colors.doge)
    .setAuthor({ name: `-${deal.discount}% na Steam` })
    .setTitle(deal.title)
    .setURL(deal.url)
    .setImage(deal.image)
    .addFields(
      { name: 'Preço', value: `~~${deal.normalPrice}~~ **${deal.finalPrice}**`, inline: true },
      { name: 'Análises', value: `${deal.rating}% positivas de ${compact.format(deal.reviews)}`, inline: true },
    );
}

export async function postFreeGames(client) {
  const guilds = alertGuilds(client);
  // no server wants alerts: don't even query the stores
  if (!guilds.length) return {};

  const sources = await Promise.allSettled([fetchEpicFreeGames(), fetchOtherFreeGames()]);
  for (const source of sources) {
    if (source.status === 'rejected') console.error('A free games source failed:', source.reason);
  }
  const games = sources.flatMap((source) => (source.status === 'fulfilled' ? source.value : []));
  return postToEachServer(guilds, games, 10, '🎁 **Jogos grátis para resgatar!**', freeGameEmbed);
}

export async function postDealsDigest(client) {
  const guilds = alertGuilds(client);
  if (!guilds.length) return {};

  // prices in reais come first, so a game posted recently can come back once it gets cheaper
  const candidates = (await fetchSteamDeals()).slice(0, 40);
  const deals = await withBrazilianPrices(candidates);
  return postToEachServer(guilds, deals, config.gameAlerts.deals.maxPerDigest, '💸 **Promoções do dia**', dealEmbed);
}

export function startGameAlerts(client) {
  const checkFreeGames = () => postFreeGames(client).catch((error) => console.error('Free games check failed:', error));
  setTimeout(checkFreeGames, 30_000);
  setInterval(checkFreeGames, config.gameAlerts.freeCheckMinutes * 60_000);
  everyDayAt(config.gameAlerts.digestHourUtc, () => postDealsDigest(client));
}
