import config from '../config.js';

const HEADERS = { 'user-agent': 'doge-bot (+https://github.com/jorgsiq/doge-bot)' };
const CHEAPSHARK = 'https://www.cheapshark.com/api/1.0';
const STEAM_STORE_ID = '1';
const EPIC_STORE_ID = '25';

async function getJson(url) {
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${new URL(url).host} responded with ${response.status}`);
  return response.json();
}

const steamUrl = (appId) => `https://store.steampowered.com/app/${appId}`;
const steamImage = (appId) => `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;
const usd = (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'USD' });

// Free games outside Epic: must not be free-to-play or shovelware, so they need a price and a reputation
export function isReputableFreeGame(deal) {
  const { minNormalPriceUsd, minRating, minReviews, minMetacritic } = config.gameAlerts.free;
  if (Number(deal.normalPrice) < minNormalPriceUsd) return false;
  const wellReviewed = Number(deal.steamRatingCount) >= minReviews && Number(deal.steamRatingPercent) >= minRating;
  return wellReviewed || Number(deal.metacriticScore) >= minMetacritic;
}

// Deals: a big discount on a game many people played and liked
export function isRelevantDeal(deal) {
  const { minDiscount, minRating, minReviews } = config.gameAlerts.deals;
  return (
    Boolean(deal.steamAppID) &&
    Number(deal.savings) >= minDiscount &&
    Number(deal.steamRatingPercent) >= minRating &&
    Number(deal.steamRatingCount) >= minReviews
  );
}

// Epic's weekly free games, already in reais
export async function fetchEpicFreeGames() {
  const { data } = await getJson(
    'https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=pt-BR&country=BR&allowCountries=BR',
  );
  const now = Date.now();

  return data.Catalog.searchStore.elements.flatMap((game) => {
    const offer = game.promotions?.promotionalOffers?.[0]?.promotionalOffers?.find(
      (offer) => Date.parse(offer.startDate) <= now && now < Date.parse(offer.endDate),
    );
    const { discountPrice, originalPrice } = game.price?.totalPrice ?? {};
    // DLCs and in-game items show up in the same list, and free-to-play games are always "free"
    if (!offer || discountPrice !== 0 || !originalPrice || game.offerType === 'ADD_ON') return [];

    const slug = game.offerMappings?.[0]?.pageSlug ?? game.catalogNs?.mappings?.[0]?.pageSlug ?? game.productSlug;
    return [
      {
        key: `epic:${game.id}`,
        title: game.title,
        store: 'Epic Games Store',
        url: `https://store.epicgames.com/pt-BR/p/${slug}`,
        image: game.keyImages?.find((image) => image.type === 'OfferImageWide')?.url,
        description: game.description,
        normalPrice: game.price.totalPrice.fmtPrice?.originalPrice,
        endsAt: new Date(offer.endDate),
      },
    ];
  });
}

let storeNames;

// Games free right now on Steam, GOG and other stores tracked by CheapShark (Epic is covered above)
export async function fetchOtherFreeGames() {
  storeNames ??= Object.fromEntries((await getJson(`${CHEAPSHARK}/stores`)).map((store) => [store.storeID, store.storeName]));
  const deals = await getJson(`${CHEAPSHARK}/deals?upperPrice=0&pageSize=60`);

  return deals
    .filter((deal) => deal.storeID !== EPIC_STORE_ID && isReputableFreeGame(deal))
    .map((deal) => ({
      key: `free:${deal.gameID}`,
      title: deal.title,
      store: storeNames[deal.storeID] ?? 'loja parceira',
      url:
        deal.storeID === STEAM_STORE_ID && deal.steamAppID
          ? steamUrl(deal.steamAppID)
          : `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`,
      image: deal.steamAppID ? steamImage(deal.steamAppID) : deal.thumb,
      normalPrice: usd(deal.normalPrice),
    }));
}

// Steam deals that pass the filter, most played first; prices are confirmed later with withBrazilianPrices
export async function fetchSteamDeals() {
  const { minRating } = config.gameAlerts.deals;
  const deals = [];
  for (let page = 0; page < 3; page++) {
    const batch = await getJson(
      `${CHEAPSHARK}/deals?storeID=${STEAM_STORE_ID}&onSale=1&steamRating=${minRating}&sortBy=Deal%20Rating&pageSize=60&pageNumber=${page}`,
    );
    deals.push(...batch);
    if (batch.length < 60) break;
  }

  return deals
    .filter(isRelevantDeal)
    .sort((a, b) => b.steamRatingCount - a.steamRatingCount)
    .map((deal) => ({
      key: `deal:${deal.gameID}`,
      appId: deal.steamAppID,
      title: deal.title,
      url: steamUrl(deal.steamAppID),
      image: steamImage(deal.steamAppID),
      rating: Number(deal.steamRatingPercent),
      reviews: Number(deal.steamRatingCount),
    }));
}

// Regional prices differ, so only deals that are also discounted in Brazil are kept, with their prices in reais
export async function withBrazilianPrices(deals) {
  if (!deals.length) return [];
  const appIds = deals.map((deal) => deal.appId).join(',');
  const prices = await getJson(`https://store.steampowered.com/api/appdetails?appids=${appIds}&cc=br&filters=price_overview`);

  return deals.flatMap((deal) => {
    const price = prices[deal.appId]?.data?.price_overview;
    if (!price?.discount_percent) return [];
    return [
      {
        ...deal,
        price: price.final,
        discount: price.discount_percent,
        normalPrice: price.initial_formatted,
        finalPrice: price.final_formatted,
      },
    ];
  });
}
