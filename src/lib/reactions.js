import { EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { getJson } from './http.js';
import { describe, localize } from './i18n.js';
import { deferResult, finishResult } from './results.js';
import { guildT } from './settings.js';

const TIMEOUT = { timeout: 3_000 };

const SOURCES = [
  async (reaction) => (await getJson(`https://nekos.best/api/v2/${reaction}`, TIMEOUT)).results[0].url,
  async (reaction) => (await getJson(`https://api.otakugifs.xyz/gif?reaction=${reaction}`, TIMEOUT)).url,
];

export async function reactionGif(reaction) {
  for (const source of SOURCES) {
    try {
      return await source(reaction);
    } catch {
      continue;
    }
  }
  return null;
}

export function reactionEmbed(text, gif) {
  const embed = new EmbedBuilder().setColor(config.colors.doge).setDescription(text);
  return gif ? embed.setImage(gif) : embed;
}

// Mentions inside an embed never notify, so the people in it are mentioned again in the message, after the emoji
export function interactionMessage(embed, { emoji, mentioned, notified }) {
  const people = [...new Map(mentioned.map((user) => [user.id, user])).values()];
  return {
    content: [emoji, ...people].filter(Boolean).join(' '),
    embeds: [embed],
    allowedMentions: { users: notified.map((user) => user.id) },
  };
}

// Commands like /kiss and /slap; their texts live in the locales under the command's name: description, done, texts, self, bot
export function reactionCommand({ name, emoji, reaction, self, bot }) {
  const data = describe(new SlashCommandBuilder().setName(name), name)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) => localize(option, 'reactions.person').setRequired(true));

  async function execute(interaction) {
    const t = guildT(interaction.guildId);
    const { user } = interaction;
    const target = interaction.options.getUser('person', true);
    const isSelf = target.id === user.id;
    const isBot = target.id === interaction.client.user.id;
    let picked;
    if (isSelf) picked = [t(`${name}.self`, { author: user }), self.reaction, self.emoji];
    else if (isBot) picked = [t(`${name}.bot`, { author: user }), bot.reaction, bot.emoji];
    else picked = [t(`${name}.texts`, { author: user, target }), reaction, emoji];
    const [text, gifReaction, textEmoji] = picked;

    const result = await deferResult(interaction, 'funChannel');
    const embed = reactionEmbed(text, await reactionGif(gifReaction));
    const notify = !isSelf && !isBot;
    const message = interactionMessage(embed, {
      emoji: textEmoji,
      mentioned: notify ? [user, target] : [user],
      notified: notify ? [target] : [],
    });
    await finishResult(interaction, result, message, { done: t(`${name}.done`), notify });
  }

  return { category: 'fun', feature: 'fun', data, execute };
}

// The same pair always gets the same score, whoever comes first, so the result is worth arguing about
export function shipScore(idA, idB) {
  const key = [idA, idB].sort().join(':');
  // FNV-1a
  let hash = 0x811c9dc5;
  for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
  return (hash >>> 0) % 101;
}

// First name without nickname or symbols: "Ricardo (Rei do Pagode)" → "Ricardo", skipping bits under 3 letters when a real word exists
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

// Start of one name plus end of the other, cut between syllables: Ricardo + Valentina = Ricatina; names up to 3 letters go whole
export function coupleName(nameA, nameB) {
  const letters = (name) => Array.from((firstName(name) || name.trim()).toLowerCase());
  const a = letters(nameA);
  const b = letters(nameB);
  // a syllable ends on a vowel followed by a consonant, and the next one starts on a consonant followed by a vowel
  let start;
  if (a.length <= 3) {
    start = a;
  } else {
    start = a.slice(
      0,
      cutNearMiddle(a.length, (i) => isVowel(a[i - 1]) && !isVowel(a[i])),
    );
  }
  const end = b.length <= 3 ? b : b.slice(cutNearMiddle(b.length, (i) => !isVowel(b[i]) && isVowel(b[i + 1])));
  const name = [...start, ...end].join('');
  return name.charAt(0).toUpperCase() + name.slice(1);
}
