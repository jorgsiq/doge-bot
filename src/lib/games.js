import config from '../config.js';
import { getJson } from './http.js';

const CHEAPSHARK = 'https://www.cheapshark.com/api/1.0';
const STEAM_STORE_ID = '1';
const EPIC_STORE_ID = '25';

const PAGE_SIZE = 60;
const MAX_PAGES = 20;
const LOOKUP_SIZE = 25;
const SHORTLIST = 50;
const RANKED = 40;
const YEAR = 365 * 24 * 60 * 60_000;

const steamUrl = (appId) => `https://store.steampowered.com/app/${appId}`;
const steamImage = (appId) => `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;
const pause = () => new Promise((resolve) => setTimeout(resolve, config.gameAlerts.requestPauseMs));
const clamp = (value) => Math.min(1, Math.max(0, value));

export const money = (language, { amount, currency }) => amount.toLocaleString(language, { style: 'currency', currency });

export function isReputableFreeGame(deal) {
  const { minNormalPriceUsd, minRating, minReviews, minMetacritic } = config.gameAlerts.free;
  if (Number(deal.normalPrice) < minNormalPriceUsd) return false;
  const wellReviewed = Number(deal.steamRatingCount) >= minReviews && Number(deal.steamRatingPercent) >= minRating;
  return wellReviewed || Number(deal.metacriticScore) >= minMetacritic;
}

export function isRelevantDeal(deal) {
  const { minDiscount, minRating, minReviews } = config.gameAlerts.deals;
  return (
    Boolean(deal.steamAppID) &&
    Number(deal.savings) >= minDiscount &&
    Number(deal.steamRatingPercent) >= minRating &&
    Number(deal.steamRatingCount) >= minReviews
  );
}

export function dealScore(deal, atLow = false, now = Date.now()) {
  const { minDiscount, minRating, minReviews, ranking } = config.gameAlerts.deals;
  const { popularReviews, freshYears, weights } = ranking;
  const age = deal.releasedAt ? (now - deal.releasedAt) / YEAR : Infinity;
  return (
    weights.popularity * clamp(Math.log(deal.reviews / minReviews) / Math.log(popularReviews / minReviews)) +
    weights.discount * clamp((deal.savings - minDiscount) / (100 - minDiscount)) +
    weights.rating * clamp((deal.rating - minRating) / (100 - minRating)) +
    weights.freshness * clamp(1 - age / freshYears) +
    weights.historicalLow * Number(atLow)
  );
}

const EDITION_WORDS =
  'game of the year|goty|deluxe|ultimate|complete|definitive|gold|premium|special|enhanced|legendary|anniversary|standard|\\d{4}';
const EDITION = new RegExp(`[\\s:–-]+(?:the\\s+)?(?:(?:${EDITION_WORDS})\\s+)+edition$|[\\s:–-]+director['’]?s cut$`, 'i');

export const baseTitle = (title) => title.replace(/[™®©]/g, '').replace(EDITION, '').trim().toLowerCase();

// Editions of one game are different products to the store: the best scored one stays and the others only lend their keys, so none comes back later
export function withoutDuplicateEditions(deals) {
  const games = new Map();
  for (const deal of deals) {
    const name = baseTitle(deal.title);
    if (games.has(name)) games.get(name).alsoKeys.push(deal.key);
    else games.set(name, { ...deal, alsoKeys: [] });
  }
  return [...games.values()];
}

export async function fetchEpicFreeGames(language, region) {
  const { data } = await getJson(
    `https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=${language}&country=${region}&allowCountries=${region}`,
  );
  const now = Date.now();

  return data.Catalog.searchStore.elements.flatMap((game) => {
    const offer = game.promotions?.promotionalOffers?.[0]?.promotionalOffers?.find(
      (offer) => Date.parse(offer.startDate) <= now && now < Date.parse(offer.endDate),
    );
    const { discountPrice, originalPrice, currencyCode, currencyInfo } = game.price?.totalPrice ?? {};
    // DLCs and in-game items show up in the same list, and free-to-play games are always "free"
    if (!offer || discountPrice !== 0 || !originalPrice || game.offerType === 'ADD_ON') return [];

    const slug = game.offerMappings?.[0]?.pageSlug ?? game.catalogNs?.mappings?.[0]?.pageSlug ?? game.productSlug;
    return [
      {
        key: `epic:${game.id}`,
        title: game.title,
        store: 'Epic Games Store',
        url: `https://store.epicgames.com/${language}/p/${slug}`,
        image: game.keyImages?.find((image) => image.type === 'OfferImageWide')?.url,
        description: game.description,
        normalPrice: { amount: originalPrice / 10 ** (currencyInfo?.decimals ?? 2), currency: currencyCode },
        endsAt: new Date(offer.endDate),
      },
    ];
  });
}

let storeNames;

export async function fetchOtherFreeGames() {
  storeNames ??= Object.fromEntries((await getJson(`${CHEAPSHARK}/stores`)).map((store) => [store.storeID, store.storeName]));
  const deals = await getJson(`${CHEAPSHARK}/deals?upperPrice=0&pageSize=60`);

  return deals
    .filter((deal) => deal.storeID !== EPIC_STORE_ID && isReputableFreeGame(deal))
    .map((deal) => {
      let url;
      if (deal.storeID === STEAM_STORE_ID && deal.steamAppID) url = steamUrl(deal.steamAppID);
      else url = `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`;
      return {
        key: `free:${deal.gameID}`,
        title: deal.title,
        store: storeNames[deal.storeID],
        url,
        image: deal.steamAppID ? steamImage(deal.steamAppID) : deal.thumb,
        normalPrice: { amount: Number(deal.normalPrice), currency: 'USD' },
      };
    });
}

// Sorted by CheapShark's own rating, which says nothing about reviews: every page is read, as the popular games can be on any of them
async function fetchSteamSales() {
  const { minRating } = config.gameAlerts.deals;
  const sales = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    if (page) await pause();
    let batch;
    try {
      batch = await getJson(
        `${CHEAPSHARK}/deals?storeID=${STEAM_STORE_ID}&onSale=1&steamRating=${minRating}&sortBy=Deal%20Rating&pageSize=${PAGE_SIZE}&pageNumber=${page}`,
      );
    } catch (error) {
      if (!page) throw error;
      console.error(`Steam deals stopped at page ${page}:`, error);
      break;
    }
    sales.push(...batch.filter(isRelevantDeal));
    if (batch.length < PAGE_SIZE) break;
  }
  return sales;
}

async function fetchCheapestPrices(deals) {
  const cheapest = new Map();
  for (let i = 0; i < deals.length; i += LOOKUP_SIZE) {
    if (i) await pause();
    const ids = deals.slice(i, i + LOOKUP_SIZE).map((deal) => deal.gameId);
    const games = await getJson(`${CHEAPSHARK}/games?ids=${ids.join(',')}`);
    for (const [id, game] of Object.entries(games)) cheapest.set(id, Number(game.cheapestPriceEver?.price));
  }
  return cheapest;
}

const toDeal = (deal) => ({
  key: `deal:${deal.gameID}`,
  gameId: deal.gameID,
  appId: deal.steamAppID,
  title: deal.title,
  url: steamUrl(deal.steamAppID),
  image: steamImage(deal.steamAppID),
  rating: Number(deal.steamRatingPercent),
  reviews: Number(deal.steamRatingCount),
  savings: Number(deal.savings),
  salePrice: Number(deal.salePrice),
  releasedAt: Number(deal.releaseDate) * 1000 || undefined,
});

export async function fetchSteamDeals() {
  const { lowTolerance } = config.gameAlerts.deals.ranking;
  const shortlist = (await fetchSteamSales())
    .map(toDeal)
    .sort((a, b) => dealScore(b) - dealScore(a))
    .slice(0, SHORTLIST);

  // the price history only adds to the score, so a failing lookup must not cost the week its digest
  const cheapest = await fetchCheapestPrices(shortlist).catch((error) => {
    console.error('The price history of the deals failed:', error);
    return new Map();
  });

  const scored = shortlist.map((deal) => ({ ...deal, score: dealScore(deal, deal.salePrice <= cheapest.get(deal.gameId) * lowTolerance) }));
  return withoutDuplicateEditions(scored.sort((a, b) => b.score - a.score)).slice(0, RANKED);
}

export async function withRegionalPrices(deals, region) {
  if (!deals.length) return [];
  const { minDiscount } = config.gameAlerts.deals;
  const input = { ids: deals.map((deal) => ({ appid: Number(deal.appId) })), context: { country_code: region } };
  const { response } = await getJson(
    `https://api.steampowered.com/IStoreBrowseService/GetItems/v1?input_json=${encodeURIComponent(JSON.stringify(input))}`,
  );
  const options = new Map(response.store_items.map((item) => [String(item.id), item.best_purchase_option]));

  return deals.flatMap((deal) => {
    const option = options.get(deal.appId);
    if (!(option?.discount_pct >= minDiscount) || !option.formatted_original_price) return [];
    const ends = (option.active_discounts ?? []).map((discount) => discount.discount_end_date).filter(Boolean);
    return [
      {
        ...deal,
        discount: option.discount_pct,
        normalPrice: option.formatted_original_price,
        finalPrice: option.formatted_final_price,
        endsAt: ends.length ? new Date(Math.max(...ends) * 1000) : undefined,
      },
    ];
  });
}
