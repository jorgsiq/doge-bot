import { AttachmentBuilder, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { coupleName, firstName, interactionMessage, pick, shipScore } from '../lib/reactions.js';
import { deferResult, finishResult } from '../lib/results.js';
import { shipImage } from '../lib/avatarImages.js';

export const category = 'Fun';
export const feature = 'fun';

export const data = new SlashCommandBuilder()
  .setName('ship')
  .setDescription('Mostra a compatibilidade entre duas pessoas')
  .setContexts(InteractionContextType.Guild)
  .addUserOption((option) => option.setName('pessoa').setDescription('Uma pessoa do casal').setRequired(true))
  .addUserOption((option) => option.setName('outra-pessoa').setDescription('A outra pessoa (se ficar vazio, é você)'));

const TITLES = [
  (a, b) => `💘 Será que ${a} e ${b} combinam?`,
  (a, b) => `💘 O cupido analisou ${a} e ${b}...`,
  (a, b) => `💘 Medindo a química entre ${a} e ${b}...`,
  (a, b) => `💘 ${a} + ${b}: vai ou não vai?`,
];

// the highest tier the score reaches
const TIERS = [
  { min: 90, text: 'Almas gêmeas! Já podem marcar o casamento 💍' },
  { min: 70, text: 'Tem química aí... 👀' },
  { min: 50, text: 'Pode dar certo, com um pouquinho de esforço 😅' },
  { min: 30, text: 'Melhor ficar só na amizade 🤝' },
  { min: 0, text: 'Nem com reza braba 💀' },
];

const bar = (score) => '█'.repeat(Math.round(score / 10)).padEnd(10, '░');

export async function execute(interaction) {
  const a = interaction.options.getUser('pessoa', true);
  const b = interaction.options.getUser('outra-pessoa') ?? interaction.user;
  // server nicknames and avatars, when they have them
  const member = (user) => interaction.guild.members.cache.get(user.id);
  // a nickname made only of emoji gives way to the global name, then the username
  const name = (user) => [member(user)?.displayName, user.displayName, user.username].find((n) => n && firstName(n)) ?? user.username;
  const avatar = (user) => (member(user) ?? user).displayAvatarURL({ extension: 'png', size: 256 });

  let text;
  if (a.id === b.id) {
    text = `💘 ${a} resolveu medir a química consigo mesmo...\n\n${bar(100)} **100%**\n\nAmor próprio em primeiro lugar 💅`;
  } else {
    const score = shipScore(a.id, b.id);
    const verdict = TIERS.find(({ min }) => score >= min).text;
    text = `${pick(TITLES)(a, b)}\n\n${bar(score)} **${score}%**\nNome do casal: **${coupleName(name(a), name(b))}**\n\n${verdict}`;
  }
  const embed = new EmbedBuilder().setColor(config.colors.doge).setDescription(text);
  // whoever was shipped is notified, except the member who did it
  const notified = [a, b].filter((user) => user.id !== interaction.user.id && !user.bot);

  // drawing the picture takes a moment, past the 3 seconds an interaction has to be answered
  const result = await deferResult(interaction, 'funChannel');
  let files = [];
  try {
    files = [new AttachmentBuilder(await shipImage(avatar(a), avatar(b)), { name: 'ship.gif' })];
    embed.setImage('attachment://ship.gif');
  } catch (error) {
    // the result still goes out, just without the picture
    console.error('Failed to draw the /ship picture:', error);
  }
  const message = { ...interactionMessage(embed, [a, b], notified), files };
  await finishResult(interaction, result, message, { done: 'O resultado do ship saiu!', notify: notified.length > 0 });
}
