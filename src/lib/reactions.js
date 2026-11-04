import { EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { deferResult, finishResult } from './results.js';

const HEADERS = { 'user-agent': `doge-bot (+${config.repositoryUrl})` };

async function getJson(url, signal) {
  const response = await fetch(url, { headers: HEADERS, signal });
  if (!response.ok) throw new Error(`${new URL(url).host} responded with ${response.status}`);
  return response.json();
}

// Free anime reaction GIF APIs, tried in order; both serve every reaction used here
const SOURCES = [
  async (reaction, signal) => (await getJson(`https://nekos.best/api/v2/${reaction}`, signal)).results[0].url,
  async (reaction, signal) => (await getJson(`https://api.otakugifs.xyz/gif?reaction=${reaction}`, signal)).url,
];

// A random GIF for the reaction, or null when every source is down (the reply then goes without one)
export async function reactionGif(reaction) {
  for (const source of SOURCES) {
    try {
      return await source(reaction, AbortSignal.timeout(3_000));
    } catch {
      // next source
    }
  }
  return null;
}

export const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function reactionEmbed(text, gif) {
  const embed = new EmbedBuilder().setColor(config.colors.doge).setDescription(text);
  return gif ? embed.setImage(gif) : embed;
}

// Mentions inside an embed never notify, so the people in it are mentioned again in the message
export function interactionMessage(embed, mentioned, notified) {
  return {
    // once each, by id: /ship can name the same person twice
    content: [...new Map(mentioned.map((user) => [user.id, user])).values()].join(' '),
    embeds: [embed],
    allowedMentions: { users: notified.map((user) => user.id) },
  };
}

// A command where a member does something to someone: /kiss, /slap...
// `texts` are (author, target) => string; doing it to yourself or to the bot gets a reply of its own
export function reactionCommand({ name, description, reaction, texts, self, bot }) {
  const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) => option.setName('pessoa').setDescription('Quem vai receber').setRequired(true));

  async function execute(interaction) {
    const { user } = interaction;
    const target = interaction.options.getUser('pessoa', true);
    const isSelf = target.id === user.id;
    const isBot = target.id === interaction.client.user.id;
    const [text, gifReaction] = isSelf
      ? [self.text(user), self.reaction]
      : isBot
        ? [bot.text(user), bot.reaction]
        : [pick(texts)(user, target), reaction];

    // the GIF APIs can take a moment, past the 3 seconds an interaction has to be answered
    const result = await deferResult(interaction, 'funChannel');
    const embed = reactionEmbed(text, await reactionGif(gifReaction));
    // only whoever got kissed or slapped is notified, not the member who did it
    const notify = !isSelf && !isBot;
    const message = notify ? interactionMessage(embed, [user, target], [target]) : interactionMessage(embed, [user], []);
    await finishResult(interaction, result, message, { notify });
  }

  return { category: 'Fun', feature: 'fun', data, execute };
}

// The same pair always gets the same score, whoever comes first, so the result is worth arguing about
export function shipScore(idA, idB) {
  const key = [idA, idB].sort().join(':');
  // FNV-1a
  let hash = 0x811c9dc5;
  for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
  return (hash >>> 0) % 101;
}

// The first name alone, without a nickname in brackets, emoji or symbols: "Ricardo (Rei do Pagode)" → "Ricardo".
// Bits shorter than 3 letters are skipped when there is a real word: "xX_Pedro_Xx" → "Pedro"
export function firstName(displayName) {
  const words = displayName
    .replace(/[([{].*?[)\]}]/gu, ' ')
    .replace(/[^\p{L}\s]/gu, ' ')
    .trim()
    .split(/\s+/u);
  return words.find((word) => word.length >= 3) ?? words[0];
}

const isVowel = (char = '') => /[aeiouáàâãéêíóôõú]/iu.test(char);

// Of the cuts `allowed` lets through, the one closest to the middle of the name (the middle itself when none is)
function cutNearMiddle(length, allowed) {
  let best = Math.round(length / 2);
  let bestDistance = Infinity;
  for (let i = 1; i < length; i++) {
    const distance = Math.abs(i - length / 2);
    if (allowed(i) && distance < bestDistance) [best, bestDistance] = [i, distance];
  }
  return best;
}

// The start of one first name and the end of the other, cut between syllables: Ricardo + Valentina = Ricatina.
// Names of up to 3 letters go in whole: Jorge + Ana = Joana
export function coupleName(nameA, nameB) {
  const letters = (name) => Array.from((firstName(name) || name.trim()).toLowerCase());
  const a = letters(nameA);
  const b = letters(nameB);
  // a syllable ends on a vowel followed by a consonant, and the next one starts on a consonant followed by a vowel
  const start = a.length <= 3 ? a : a.slice(0, cutNearMiddle(a.length, (i) => isVowel(a[i - 1]) && !isVowel(a[i])));
  const end = b.length <= 3 ? b : b.slice(cutNearMiddle(b.length, (i) => !isVowel(b[i]) && isVowel(b[i + 1])));
  const name = [...start, ...end].join('');
  return name.charAt(0).toUpperCase() + name.slice(1);
}
