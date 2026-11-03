import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { coupleName, reactionEmbed, reactionGif, shipScore } from '../lib/reactions.js';

export const category = 'Fun';

export const data = new SlashCommandBuilder()
  .setName('ship')
  .setDescription('Mostra a compatibilidade entre duas pessoas')
  .setContexts(InteractionContextType.Guild)
  .addUserOption((option) => option.setName('pessoa').setDescription('Uma pessoa do casal').setRequired(true))
  .addUserOption((option) => option.setName('outra').setDescription('A outra pessoa (se ficar vazio, é você)'));

// the highest tier the score reaches
const TIERS = [
  { min: 90, reaction: 'kiss', text: 'Almas gêmeas! Já podem marcar o casamento 💍' },
  { min: 70, reaction: 'cuddle', text: 'Tem química aí... 👀' },
  { min: 50, reaction: 'blush', text: 'Pode dar certo, com um pouquinho de esforço 😅' },
  { min: 30, reaction: 'shrug', text: 'Melhor ficar só na amizade 🤝' },
  { min: 0, reaction: 'facepalm', text: 'Nem com reza braba 💀' },
];

const bar = (score) => '█'.repeat(Math.round(score / 10)).padEnd(10, '░');

export async function execute(interaction) {
  const a = interaction.options.getUser('pessoa', true);
  const b = interaction.options.getUser('outra') ?? interaction.user;
  // server nicknames make better couple names than usernames
  const name = (user) => interaction.guild.members.cache.get(user.id)?.displayName ?? user.displayName;

  let text;
  let reaction;
  if (a.id === b.id) {
    text = `💘 ${a} + ${b}\n${bar(100)} **100%**\n\nAmor próprio em primeiro lugar 💅`;
    reaction = 'happy';
  } else {
    const score = shipScore(a.id, b.id);
    const tier = TIERS.find(({ min }) => score >= min);
    text = `💘 ${a} + ${b}\n${bar(score)} **${score}%**\nNome do casal: **${coupleName(name(a), name(b))}**\n\n${tier.text}`;
    reaction = tier.reaction;
  }

  // the GIF APIs can take a moment, past the 3 seconds an interaction has to be answered
  await interaction.deferReply();
  await interaction.editReply({ embeds: [reactionEmbed(text, await reactionGif(reaction))] });
}
