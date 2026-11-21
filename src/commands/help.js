import { EmbedBuilder, InteractionContextType, SlashCommandBuilder, chatInputApplicationCommandMention } from 'discord.js';
import config from '../config.js';
import { describe } from '../lib/i18n.js';
import { ephemeral } from '../lib/replies.js';
import { getLanguage, guildT, isEnabled } from '../lib/settings.js';

export const category = 'info';

const categoryOrder = ['info', 'fun', 'music', 'rooms', 'admin'];

export const data = describe(new SlashCommandBuilder().setName('help'), 'help').setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const t = guildT(interaction.guildId);
  const language = getLanguage(interaction.guildId);
  const registered = interaction.client.application.commands.cache;

  const available = interaction.client.commands.filter((command) => {
    if (command.feature && !isEnabled(interaction.guildId, command.feature)) return false;
    const permission = command.data.default_member_permissions;
    return !permission || interaction.memberPermissions.has(BigInt(permission));
  });

  const fields = categoryOrder
    .map((category) => {
      const lines = available
        .filter((command) => command.category === category)
        .map(({ data }) => {
          const id = registered.find((command) => command.name === data.name)?.id;
          const mention = id ? chatInputApplicationCommandMention(data.name, id) : `**/${data.name}**`;
          return `${mention} — ${data.description_localizations?.[language] ?? data.description}`;
        });
      return { name: t(`help.categories.${category}`), value: lines.join('\n') };
    })
    .filter((field) => field.value);

  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle(t('help.title', { user: interaction.user.username }))
    .setDescription(t('help.intro', { server: interaction.guild.name }))
    .addFields(fields)
    .setFooter({ text: t('help.footer', { email: config.supportEmail }) });

  await interaction.reply(ephemeral({ embeds: [embed] }));
}
