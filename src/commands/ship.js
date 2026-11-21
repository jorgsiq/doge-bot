import { AttachmentBuilder, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { shipImage } from '../lib/avatarImages.js';
import { describe, localize } from '../lib/i18n.js';
import { coupleName, firstName, interactionMessage, shipScore } from '../lib/reactions.js';
import { deferResult, finishResult } from '../lib/results.js';
import { guildT } from '../lib/settings.js';

export const category = 'fun';
export const feature = 'fun';

export const data = describe(new SlashCommandBuilder().setName('ship'), 'ship')
  .setContexts(InteractionContextType.Guild)
  .addUserOption((option) => localize(option, 'ship.options.person').setRequired(true))
  .addUserOption((option) => localize(option, 'ship.options.otherPerson'));

// the highest tier the score reaches; their texts are ship.tiers.<min>
const TIERS = [90, 70, 50, 30, 0];

const bar = (score) => '█'.repeat(Math.round(score / 10)).padEnd(10, '░');

export async function execute(interaction) {
  const t = guildT(interaction.guildId);
  const a = interaction.options.getUser('person', true);
  const b = interaction.options.getUser('other-person') ?? interaction.user;
  const member = (user) => interaction.guild.members.cache.get(user.id);
  const name = (user) => [member(user)?.displayName, user.displayName, user.username].find((n) => n && firstName(n)) ?? user.username;
  const avatar = (user) => (member(user) ?? user).displayAvatarURL({ extension: 'png', size: 256 });

  let text;
  if (a.id === b.id) {
    text = t('ship.self', { user: a, bar: bar(100) });
  } else {
    const score = shipScore(a.id, b.id);
    text = t('ship.result', {
      title: t('ship.titles', { a, b }),
      bar: bar(score),
      score,
      couple: coupleName(name(a), name(b)),
      verdict: t(`ship.tiers.${TIERS.find((min) => score >= min)}`),
    });
  }
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setDescription(text)
    .setFooter({ text: t('ship.footer', { user: interaction.user.username }) });
  const notified = [a, b].filter((user) => user.id !== interaction.user.id && !user.bot);

  const result = await deferResult(interaction, 'funChannel');
  let files = [];
  try {
    files = [new AttachmentBuilder(await shipImage(avatar(a), avatar(b)), { name: 'ship.gif' })];
    embed.setImage('attachment://ship.gif');
  } catch (error) {
    console.error('Failed to draw the /ship picture:', error);
  }
  const message = { ...interactionMessage(embed, { emoji: '💘', mentioned: [a, b], notified }), files };
  await finishResult(interaction, result, message, { done: t('ship.done'), notify: notified.length > 0 });
}
