import assert from 'node:assert/strict';
import { test } from 'node:test';
import config from '../src/config.js';
import { postDealsDigest, postFreeGames } from '../src/lib/gameAlerts.js';
import { setSetting, setSwitchedOn } from '../src/lib/settings.js';

const epicAnswer = (language) => ({
  data: {
    Catalog: {
      searchStore: {
        elements: [
          {
            id: 'epic-game',
            title: 'Mark of the Deep',
            offerType: 'BASE_GAME',
            description: language === 'pt-BR' ? 'Uma aventura pirata' : 'A pirate adventure',
            price: { totalPrice: { discountPrice: 0, originalPrice: 3999, currencyCode: 'BRL', currencyInfo: { decimals: 2 } } },
            promotions: {
              promotionalOffers: [{ promotionalOffers: [{ startDate: '2020-01-01T00:00:00Z', endDate: '2099-01-01T00:00:00Z' }] }],
            },
            offerMappings: [{ pageSlug: 'mark-of-the-deep' }],
            keyImages: [],
          },
        ],
      },
    },
  },
});

function mockStores(context) {
  context.mock.method(globalThis, 'fetch', async (url) => {
    const { host, searchParams } = new URL(url);
    const body = host.includes('epicgames') ? epicAnswer(searchParams.get('locale')) : [];
    return { ok: true, status: 200, json: async () => body };
  });
}

async function server(id, language, region) {
  const posts = [];
  await setSwitchedOn(id, 'gameAlerts', true);
  await setSetting(id, 'alertsChannel', `${id}-channel`);
  if (language) await setSetting(id, 'language', language);
  if (region) await setSetting(id, 'region', region);
  const guild = {
    id,
    name: id,
    roles: { cache: new Map() },
    channels: { fetch: async () => ({ send: async (payload) => void posts.push(payload) }) },
  };
  return { guild, posts };
}

test('free games are posted in the language of each server', async (context) => {
  mockStores(context);
  const english = await server('alerts-english');
  const portuguese = await server('alerts-portuguese', 'pt-BR');
  const client = {
    guilds: {
      cache: new Map([
        [english.guild.id, english.guild],
        [portuguese.guild.id, portuguese.guild],
      ]),
    },
  };

  await postFreeGames(client);

  const [englishPost] = english.posts;
  assert.match(englishPost.content, /Free games to claim/);
  const englishEmbed = englishPost.embeds[0].data;
  assert.equal(englishEmbed.author.name, 'Free on Epic Games Store');
  assert.equal(englishEmbed.description, 'A pirate adventure');
  assert.match(englishEmbed.fields[0].value, /R\$\s?39\.99.*Free/);

  const [portuguesePost] = portuguese.posts;
  assert.match(portuguesePost.content, /Jogos grátis para resgatar/);
  const portugueseEmbed = portuguesePost.embeds[0].data;
  assert.equal(portugueseEmbed.author.name, 'Grátis na Epic Games Store');
  assert.equal(portugueseEmbed.description, 'Uma aventura pirata');
  assert.match(portugueseEmbed.fields[0].value, /R\$\s?39,99.*Grátis/);
});

test('a game already posted in a server is not posted there again', async (context) => {
  mockStores(context);
  const { guild, posts } = await server('alerts-once');
  const client = { guilds: { cache: new Map([[guild.id, guild]]) } };

  await postFreeGames(client);
  await postFreeGames(client);

  assert.equal(posts.length, 1);
});

test('the stores are not even asked when no server wants alerts', async (context) => {
  const fetch = context.mock.method(globalThis, 'fetch', async () => {
    throw new Error('nobody asked for alerts');
  });

  assert.deepEqual(await postFreeGames({ guilds: { cache: new Map() } }), {});
  assert.equal(fetch.mock.callCount(), 0);
});

const clientOf = (...servers) => ({ guilds: { cache: new Map(servers.map(({ guild }) => [guild.id, guild])) } });

test('Epic is asked once for each language and region the servers use, and links the store in the language of the server', async (context) => {
  const requests = [];
  context.mock.method(globalThis, 'fetch', async (url) => {
    const { host, searchParams } = new URL(url);
    if (host.includes('epicgames')) requests.push(`${searchParams.get('locale')}/${searchParams.get('country')}`);
    const body = host.includes('epicgames') ? epicAnswer(searchParams.get('locale')) : [];
    return { ok: true, status: 200, json: async () => body };
  });
  const american = await server('market-american');
  const brazilian = await server('market-brazilian', 'pt-BR');
  const portuguese = await server('market-portuguese', 'en-US', 'PT');
  const portugueseToo = await server('market-portuguese-too', 'en-US', 'PT');

  await postFreeGames(clientOf(american, brazilian, portuguese, portugueseToo));

  assert.deepEqual(requests.sort(), ['en-US/PT', 'en-US/US', 'pt-BR/BR']);
  assert.equal(american.posts[0].embeds[0].data.url, 'https://store.epicgames.com/en-US/p/mark-of-the-deep');
  assert.equal(brazilian.posts[0].embeds[0].data.url, 'https://store.epicgames.com/pt-BR/p/mark-of-the-deep');
  assert.equal(portugueseToo.posts.length, 1);
});

const dealRow = (id, title, { savings = '80', rating = '95', reviews = '50000', price = '2.00', released = '2025-06-01' } = {}) => ({
  gameID: `g${id}`,
  steamAppID: String(id),
  title,
  savings,
  steamRatingPercent: rating,
  steamRatingCount: reviews,
  salePrice: price,
  releaseDate: String(Date.parse(released) / 1000),
});

const filler = (count) => Array.from({ length: count }, (_, i) => ({ ...dealRow(900 + i, `Filler ${i}`), savings: '10' }));

// what each region's Steam store says about each app: [discount, original price, final price]
const regionalStores = {
  BR: { 1: [80, 'R$ 50,00', 'R$ 10,00'], 2: [80, 'R$ 60,00', 'R$ 12,00'], 3: [60, 'R$ 40,00', 'R$ 16,00'] },
  US: { 1: [80, '$10.00', '$2.00'], 2: [80, '$12.00', '$2.40'], 3: [0, '$8.00', '$8.00'] },
};

function mockSteam(context, { page0 = [], page1 = [], failing = [], pages = [] } = {}) {
  config.gameAlerts.requestPauseMs = 0;
  context.after(() => (config.gameAlerts.requestPauseMs = 500));
  context.mock.method(globalThis, 'fetch', async (url) => {
    const { host, pathname, searchParams } = new URL(url);
    let body;
    if (host === 'api.steampowered.com') {
      const { ids, context: region } = JSON.parse(searchParams.get('input_json'));
      if (failing.includes(region.country_code)) return { ok: false, status: 500 };
      const items = ids.flatMap(({ appid }) => {
        const [discount, original, final] = regionalStores[region.country_code]?.[appid] ?? [];
        if (!original) return [];
        const best = { discount_pct: discount, formatted_original_price: original, formatted_final_price: final };
        if (discount) best.active_discounts = [{ discount_end_date: 4102444800 }];
        return [{ id: appid, best_purchase_option: best }];
      });
      body = { response: { store_items: items } };
    } else if (pathname.endsWith('/games')) {
      body = Object.fromEntries(
        searchParams
          .get('ids')
          .split(',')
          .map((id) => [id, { cheapestPriceEver: { price: '2.00' } }]),
      );
    } else {
      const page = Number(searchParams.get('pageNumber'));
      pages.push(page);
      body = page === 0 ? page0 : page1;
    }
    return { ok: true, status: 200, json: async () => body };
  });
}

const gameA = dealRow(1, 'Game A', { reviews: '50000' });
const gameADeluxe = dealRow(2, 'Game A: Deluxe Edition', { reviews: '40000' });
const gameB = dealRow(3, 'Game B', { savings: '60', rating: '90', reviews: '20000', released: '2015-01-01' });

const titlesOf = ({ embeds }) => embeds.map((embed) => embed.data.title);

test('the weekly digest reads every page, ranks once and prices each server in its own region', async (context) => {
  const pages = [];
  mockSteam(context, { page0: [gameA, gameADeluxe, ...filler(58)], page1: [gameB], pages });
  const brazilian = await server('digest-brazilian', 'pt-BR');
  const american = await server('digest-american');

  await postDealsDigest(clientOf(brazilian, american));

  assert.deepEqual(pages, [0, 1], 'the popular games can be on any page');
  const [brazilianPost] = brazilian.posts;
  assert.deepEqual(titlesOf(brazilianPost), ['Game A', 'Game B'], 'the two editions of the game are one');
  assert.equal(brazilianPost.embeds[0].data.fields[0].value, '~~R$ 50,00~~ **R$ 10,00**');
  assert.equal(brazilianPost.embeds[0].data.author.name, '-80% na Steam');

  const [americanPost] = american.posts;
  assert.deepEqual(titlesOf(americanPost), ['Game A'], 'Game B is not on sale in that region');
  assert.equal(americanPost.embeds[0].data.fields[0].value, '~~$10.00~~ **$2.00**');
});

test('an edition of a game already posted is not posted in its place the next week', async (context) => {
  mockSteam(context, { page0: [gameA, gameADeluxe] });
  const first = await server('digest-editions');
  const client = clientOf(first);
  await postDealsDigest(client);
  assert.deepEqual(titlesOf(first.posts[0]), ['Game A']);

  mockSteam(context, { page0: [gameADeluxe] });
  await postDealsDigest(client);
  assert.equal(first.posts.length, 1);
});

test('a region whose prices fail does not stop the others, unless all of them fail', async (context) => {
  context.mock.method(console, 'error', () => {});
  mockSteam(context, { page0: [gameA], failing: ['US'] });
  const brazilian = await server('digest-failing-brazilian', 'pt-BR');
  const american = await server('digest-failing-american');

  await postDealsDigest(clientOf(brazilian, american));
  assert.equal(brazilian.posts.length, 1);
  assert.equal(american.posts.length, 0);

  const lonely = await server('digest-failing-lonely');
  await assert.rejects(postDealsDigest(clientOf(lonely)));
});
