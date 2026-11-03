import { EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';

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

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function reactionEmbed(text, gif) {
  const embed = new EmbedBuilder().setColor(config.colors.doge).setDescription(text);
  return gif ? embed.setImage(gif) : embed;
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
    const [text, gifReaction] =
      target.id === user.id
        ? [self.text(user), self.reaction]
        : target.id === interaction.client.user.id
          ? [bot.text(user), bot.reaction]
          : [pick(texts)(user, target), reaction];

    // the GIF APIs can take a moment, past the 3 seconds an interaction has to be answered
    await interaction.deferReply();
    await interaction.editReply({ embeds: [reactionEmbed(text, await reactionGif(gifReaction))] });
  }

  return { category: 'Fun', data, execute };
}

// The same pair always gets the same score, whoever comes first, so the result is worth arguing about
export function shipScore(idA, idB) {
  const key = [idA, idB].sort().join(':');
  // FNV-1a
  let hash = 0x811c9dc5;
  for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
  return (hash >>> 0) % 101;
}

// The first half of one name and the second half of the other, e.g. Jorge + Ana = Jorna
export function coupleName(nameA, nameB) {
  const a = Array.from(nameA.trim());
  const b = Array.from(nameB.trim());
  return a.slice(0, Math.ceil(a.length / 2)).join('') + b.slice(Math.floor(b.length / 2)).join('');
}
