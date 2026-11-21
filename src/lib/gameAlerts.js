import { EmbedBuilder, TimestampStyles, time } from 'discord.js';
import config from '../config.js';
import { fetchEpicFreeGames, fetchOtherFreeGames, fetchSteamDeals, money, withRegionalPrices } from './games.js';
import { translator } from './i18n.js';
import { everyWeekAt } from './schedule.js';
import { enabledGuilds, getLanguage, getRegion, getRole, getSetting, guildT } from './settings.js';
import * as store from './store.js';

// guild id -> key -> { at, endsAt }: what each server already got, so nothing repeats there
const posted = store.section('postedGameAlerts');
const DAY = 24 * 60 * 60_000;

const compactNumbers = new Map();
function compact(language) {
  if (!compactNumbers.has(language)) compactNumbers.set(language, new Intl.NumberFormat(language, { notation: 'compact' }));
  return compactNumbers.get(language);
}

export function canRepost(last, now = Date.now()) {
  return now >= (last.endsAt ?? last.at + config.gameAlerts.repostAfterDays * DAY);
}

const keysOf = (item) => [item.key, ...(item.alsoKeys ?? [])];

const isNew = (guildId, item) => keysOf(item).every((key) => !posted[guildId]?.[key] || canRepost(posted[guildId][key]));

async function markPosted(guildId, items) {
  const guildPosted = (posted[guildId] ??= {});
  for (const [key, last] of Object.entries(guildPosted)) if (canRepost(last)) delete guildPosted[key];
  for (const item of items) {
    for (const key of keysOf(item)) guildPosted[key] = { at: Date.now(), endsAt: item.endsAt?.getTime() };
  }
  await store.save();
}

async function publish(guild, title, embeds) {
  const channel = await guild.channels.fetch(getSetting(guild.id, 'alertsChannel'));
  const role = getRole(guild, 'subscriberRole');
  await channel.send({ content: role ? `${role} ${title}` : title, embeds, allowedMentions: { roles: role ? [role.id] : [] } });
}

async function postToEachServer(guilds, itemsFor, limit, titleKey, toEmbed) {
  const result = {};
  for (const guild of guilds) {
    const fresh = itemsFor(guild)
      .filter((item) => isNew(guild.id, item))
      .slice(0, limit);
    if (!fresh.length) continue;
    try {
      const language = getLanguage(guild.id);
      await publish(
        guild,
        guildT(guild.id)(titleKey),
        fresh.map((item) => toEmbed(language, item)),
      );
      await markPosted(guild.id, fresh);
      result[guild.id] = fresh;
    } catch (error) {
      console.error(`Failed to post game alerts in ${guild.name}:`, error);
    }
  }
  return result;
}

function freeGameEmbed(language, game) {
  const t = translator(language);
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setAuthor({ name: t('gameAlerts.freeAuthor', { store: game.store ?? t('gameAlerts.partnerStore') }) })
    .setTitle(game.title)
    .setURL(game.url)
    .setImage(game.image ?? null)
    .addFields({
      name: t('gameAlerts.price'),
      value: game.normalPrice ? t('gameAlerts.priceFree', { price: money(language, game.normalPrice) }) : t('gameAlerts.free'),
      inline: true,
    });

  if (game.endsAt) {
    embed.addFields({ name: t('gameAlerts.claimBy'), value: time(game.endsAt, TimestampStyles.LongDateShortTime), inline: true });
  }
  if (game.description) embed.setDescription(game.description.length > 200 ? `${game.description.slice(0, 199)}…` : game.description);
  return embed;
}

function dealEmbed(language, deal) {
  const t = translator(language);
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setAuthor({ name: t('gameAlerts.dealAuthor', { discount: deal.discount }) })
    .setTitle(deal.title)
    .setURL(deal.url)
    .setImage(deal.image)
    .addFields(
      {
        name: t('gameAlerts.price'),
        value: t('gameAlerts.priceDeal', { price: deal.normalPrice, final: deal.finalPrice }),
        inline: true,
      },
      {
        name: t('gameAlerts.reviews'),
        value: t('gameAlerts.reviewsValue', { rating: deal.rating, reviews: compact(language).format(deal.reviews) }),
        inline: true,
      },
    );

  if (deal.endsAt) {
    embed.addFields({ name: t('gameAlerts.saleUntil'), value: time(deal.endsAt, TimestampStyles.LongDateShortTime), inline: true });
  }
  return embed;
}

const valuesOf = (settled) => (settled.status === 'fulfilled' ? settled.value : []);

export async function postFreeGames(client) {
  const guilds = enabledGuilds(client, 'gameAlerts');
  if (!guilds.length) return {};

  // Epic answers in the language and with the prices of the region of each server, so it is asked once per pair of them
  const marketOf = (guild) => `${getLanguage(guild.id)}/${getRegion(guild.id)}`;
  const markets = [...new Set(guilds.map(marketOf))];
  const [others, ...epic] = await Promise.allSettled([
    fetchOtherFreeGames(),
    ...markets.map((market) => fetchEpicFreeGames(...market.split('/'))),
  ]);
  for (const source of [others, ...epic]) if (source.status === 'rejected') console.error('A free games source failed:', source.reason);
  const epicByMarket = new Map(markets.map((market, i) => [market, valuesOf(epic[i])]));
  const gamesFor = (guild) => [...(epicByMarket.get(marketOf(guild)) ?? []), ...valuesOf(others)];
  return postToEachServer(guilds, gamesFor, 10, 'gameAlerts.freeTitle', freeGameEmbed);
}

export async function postDealsDigest(client) {
  const guilds = enabledGuilds(client, 'gameAlerts');
  if (!guilds.length) return {};

  // the ranking is the same everywhere, so only the prices are asked once per region, before the repeat check that needs the end of each sale
  const ranked = await fetchSteamDeals();
  const regions = [...new Set(guilds.map((guild) => getRegion(guild.id)))];
  const priced = await Promise.allSettled(regions.map((region) => withRegionalPrices(ranked, region)));
  for (const source of priced) if (source.status === 'rejected') console.error('The prices of a region failed:', source.reason);
  if (priced.every((source) => source.status === 'rejected')) throw priced[0].reason;
  const dealsByRegion = new Map(regions.map((region, i) => [region, valuesOf(priced[i])]));
  const dealsFor = (guild) => dealsByRegion.get(getRegion(guild.id)) ?? [];
  return postToEachServer(guilds, dealsFor, config.gameAlerts.deals.maxPerDigest, 'gameAlerts.dealsTitle', dealEmbed);
}

export function startGameAlerts(client) {
  const checkFreeGames = () => postFreeGames(client).catch((error) => console.error('Free games check failed:', error));
  setTimeout(checkFreeGames, 30_000);
  setInterval(checkFreeGames, config.gameAlerts.freeCheckMinutes * 60_000);
  const { weekdayUtc, hourUtc } = config.gameAlerts.digest;
  everyWeekAt('deals', weekdayUtc, hourUtc, 30, () => postDealsDigest(client));
}
