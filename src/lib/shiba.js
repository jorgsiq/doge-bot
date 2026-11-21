import { EmbedBuilder } from 'discord.js';
import config from '../config.js';
import { getJson } from './http.js';
import { pick } from './random.js';
import { everyDayAt } from './schedule.js';
import { enabledGuilds, getLanguage, getSetting, guildT } from './settings.js';
import * as store from './store.js';

const posted = store.section('postedShibas');

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const PHOTO = /\.(jpe?g|png|webp)$/i;

async function query(params) {
  const url = new URL(COMMONS_API);
  url.search = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', ...params });
  return getJson(url);
}

export const isLandscape = (size) => Boolean(size) && size.width >= size.height * config.shibaOfTheDay.minAspectRatio;

export async function listPhotos() {
  const ids = new Set();
  for (const category of config.shibaOfTheDay.categories) {
    let next = {};
    do {
      const data = await query({
        generator: 'categorymembers',
        gcmtitle: `Category:${category}`,
        gcmtype: 'file',
        gcmlimit: '500',
        prop: 'imageinfo',
        iiprop: 'size',
        ...next,
      });
      // an empty category comes without query
      for (const file of data.query?.pages ?? []) if (PHOTO.test(file.title) && isLandscape(file.imageinfo?.[0])) ids.add(file.pageid);
      next = data.continue;
    } while (next);
  }
  return [...ids];
}

export function unseenPhotos(photos, seen) {
  const unseen = photos.filter((id) => !seen.includes(id));
  return unseen.length ? { unseen, seen } : { unseen: photos, seen: [] };
}

// A resized copy of the photo and its credits: Commons licenses ask for the author to be credited
export async function getPhoto(pageId) {
  const data = await query({
    pageids: String(pageId),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '1024',
    iiextmetadatafilter: 'Artist|LicenseShortName',
  });
  const [info] = data.query.pages[0].imageinfo;
  const { Artist, LicenseShortName } = info.extmetadata ?? {};
  return {
    image: info.thumburl ?? info.url,
    // the artist comes as HTML, often a link to their user page
    author: Artist?.value
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
    license: LicenseShortName?.value,
  };
}

const longDates = new Map();
function longDate(language) {
  if (!longDates.has(language)) {
    longDates.set(language, new Intl.DateTimeFormat(language, { dateStyle: 'long', timeZone: 'America/Sao_Paulo' }));
  }
  return longDates.get(language);
}

export function shibaEmbed(guildId, photo, date = new Date()) {
  const t = guildT(guildId);
  const credits = [photo.author && t('shiba.photoBy', { author: photo.author.slice(0, 100) }), photo.license, 'Wikimedia Commons']
    .filter(Boolean)
    .join(' · ');
  return new EmbedBuilder()
    .setColor(config.colors.doge)
    .setAuthor({ name: longDate(getLanguage(guildId)).format(date), iconURL: config.images.dogeIcon })
    .setImage(photo.image)
    .setFooter({ text: credits });
}

async function postShiba(guild, photos) {
  const { unseen, seen } = unseenPhotos(photos, posted[guild.id] ?? []);
  const id = pick(unseen);
  const photo = await getPhoto(id);

  const channel = await guild.channels.fetch(getSetting(guild.id, 'shibaChannel'));
  await channel.send({ embeds: [shibaEmbed(guild.id, photo)] });
  posted[guild.id] = [...seen, id];
  await store.save();
}

export async function postShibaOfTheDay(client) {
  const guilds = enabledGuilds(client, 'shiba');
  if (!guilds.length) return;

  const photos = await listPhotos();
  for (const guild of guilds) {
    try {
      await postShiba(guild, photos);
    } catch (error) {
      console.error(`Failed to post the shiba of the day in ${guild.name}:`, error);
    }
  }
}

export function startShibaOfTheDay(client) {
  everyDayAt('shiba', config.shibaOfTheDay.hourUtc, 15, () => postShibaOfTheDay(client));
}
