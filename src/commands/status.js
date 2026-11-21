import { ActivityType, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { choice, describe, localize } from '../lib/i18n.js';
import { setStatus } from '../lib/presence.js';
import { ephemeral } from '../lib/replies.js';
import { guildT } from '../lib/settings.js';
import { postUpdate } from '../lib/updates.js';

export const category = 'admin';

const activityTypes = {
  playing: ActivityType.Playing,
  watching: ActivityType.Watching,
  listening: ActivityType.Listening,
  competing: ActivityType.Competing,
  streaming: ActivityType.Streaming,
  custom: ActivityType.Custom,
};

export const data = describe(new SlashCommandBuilder().setName('status'), 'status')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setContexts(InteractionContextType.Guild)
  .addStringOption((option) =>
    localize(option, 'status.options.type')
      .setRequired(true)
      .addChoices(...Object.keys(activityTypes).map((key) => choice(`status.choices.${key}`, key))),
  )
  .addStringOption((option) => localize(option, 'status.options.text').setRequired(true).setMaxLength(128))
  .addStringOption((option) => localize(option, 'status.options.url'));

async function isBotOwner(interaction) {
  const { owner } = await interaction.client.application.fetch();
  return owner?.members ? owner.members.has(interaction.user.id) : owner?.id === interaction.user.id;
}

export async function execute(interaction) {
  const t = guildT(interaction.guildId);
  if (!(await isBotOwner(interaction))) return interaction.reply(ephemeral(t('status.notOwner')));

  const activity = interaction.options.getString('type', true);
  const name = interaction.options.getString('text', true);
  const url = interaction.options.getString('url') ?? undefined;

  await setStatus(interaction.client, { name, type: activityTypes[activity], url });

  const status = `**${`${t(`status.labels.${activity}`)} ${name}`.trim()}**${url ? `\n${url}` : ''}`;
  postUpdate(
    interaction.guild,
    new EmbedBuilder()
      .setTitle(t('status.title'))
      .setColor(config.colors.doge)
      .setDescription(status)
      .setImage(config.images.status[activity])
      .setTimestamp(),
  );

  await interaction.reply(ephemeral(t('status.changed', { status })));
}
