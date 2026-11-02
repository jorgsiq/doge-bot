import { EmbedBuilder } from 'discord.js';
import config from '../config.js';
import { everyDayAt } from './schedule.js';
import { getSetting, isEnabled } from './settings.js';
import * as store from './store.js';

// guild id -> page ids of the photos already posted there
const posted = store.section('postedShibas');

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
// Wikimedia asks API clients to identify themselves
const HEADERS = { 'user-agent': `doge-bot (+${config.repositoryUrl})` };
// categories also hold videos and documents
const PHOTO = /\.(jpe?g|png|webp)$/i;

async function query(params) {
  const url = new URL(COMMONS_API);
  url.search = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', ...params });
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Wikimedia Commons responded with ${response.status}`);
  return response.json();
}

// Page ids of every photo in the configured categories, read on each run so new uploads join in
export async function listPhotos() {
  const ids = new Set();
  for (const category of config.shibaOfTheDay.categories) {
    // a category is listed 500 files at a time
    let next = {};
    do {
      const data = await query({ list: 'categorymembers', cmtitle: `Category:${category}`, cmtype: 'file', cmlimit: '500', ...next });
      for (const file of data.query.categorymembers) {
        if (PHOTO.test(file.title)) ids.add(file.pageid);
      }
      next = data.continue;
    } while (next);
  }
  return [...ids];
}

// The photos a server hasn't seen yet and what it has seen, which starts over once every photo was posted there
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
    author: Artist?.value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    license: LicenseShortName?.value,
  };
}

// e.g. "1 de novembro de 2026", the day in Brasília
const longDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' });

export function shibaEmbed(photo, date = new Date()) {
  const credits = [photo.author && `Foto: ${photo.author.slice(0, 100)}`, photo.license, 'Wikimedia Commons'].filter(Boolean).join(' · ');
  // the author line is the only one in an embed that takes an icon
  return new EmbedBuilder()
    .setColor(config.colors.doge)
    .setAuthor({ name: longDate.format(date), iconURL: config.images.dogeIcon })
    .setImage(photo.image)
    .setFooter({ text: credits });
}

async function postShiba(guild, photos) {
  const { unseen, seen } = unseenPhotos(photos, posted[guild.id] ?? []);
  const id = unseen[Math.floor(Math.random() * unseen.length)];
  const photo = await getPhoto(id);

  const channel = await guild.channels.fetch(getSetting(guild.id, 'shibaChannel'));
  await channel.send({ embeds: [shibaEmbed(photo)] });
  posted[guild.id] = [...seen, id];
  await store.save();
}

export async function postShibaOfTheDay(client) {
  const guilds = [...client.guilds.cache.values()].filter((guild) => isEnabled(guild.id, 'shiba'));
  // no server wants it: don't even query Commons
  if (!guilds.length) return;

  const photos = await listPhotos();
  for (const guild of guilds) {
    try {
      await postShiba(guild, photos);
    } catch (error) {
      // a server with a deleted channel or missing permission must not stop the others
      console.error(`Failed to post the shiba of the day in ${guild.name}:`, error);
    }
  }
}

export function startShibaOfTheDay(client) {
  everyDayAt(config.shibaOfTheDay.hourUtc, () => postShibaOfTheDay(client));
}
