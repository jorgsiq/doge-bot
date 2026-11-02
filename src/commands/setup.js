import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import config from '../config.js';
import {
  features,
  getRole,
  getSetting,
  isSwitchedOn,
  missingSettings,
  setSetting,
  setSwitchedOn,
  settingDefinitions,
} from '../lib/settings.js';

export const category = 'Admin';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Ativa, desativa e configura as funções do bot neste servidor')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setContexts(InteractionContextType.Guild);

const featureOf = (settingKey) => Object.keys(features).find((key) => features[key].settings.includes(settingKey));

// `missing` says what a feature switched on still lacks, the one status that needs explaining
function status(guildId, feature) {
  if (!isSwitchedOn(guildId, feature)) return { label: 'Inativo' };
  const missing = missingSettings(guildId, feature);
  if (missing.length) {
    return { label: 'Incompleto', missing: `falta escolher: ${missing.map((key) => settingDefinitions[key].label.toLowerCase()).join(', ')}` };
  }
  return { label: 'Ativo' };
}

// The channels or roles picked right now, leaving out what the server no longer has
function currentItems(guild, key) {
  if (settingDefinitions[key].kind === 'role') return [getRole(guild, key)].filter(Boolean);
  return [getSetting(guild.id, key)].flat().map((id) => guild.channels.cache.get(id)).filter(Boolean);
}

function describe(guild, key) {
  const items = currentItems(guild, key);
  if (!items.length) return '**nenhum**';
  // embed fields are capped at 1024 characters
  return items.join(', ').slice(0, 1024);
}

export function hubPanel(guild, notice) {
  // Discord has no tables: two inline fields side by side make one, with a single line per feature so the rows line up
  const rows = Object.entries(features).map(([key, { name }]) => ({ feature: name, status: status(guild.id, key).label }));
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle('⚙️ Configuração do Đoge Bot')
    .setDescription('Escolha uma função no menu para ativar, desativar ou configurar.')
    .addFields(
      { name: 'Função', value: rows.map((row) => row.feature).join('\n'), inline: true },
      { name: 'Status', value: rows.map((row) => row.status).join('\n'), inline: true },
    );
  if (notice) embed.setFooter({ text: notice });

  const menu = new StringSelectMenuBuilder()
    .setCustomId('setup:feature')
    .setPlaceholder('Escolha uma função...')
    .addOptions(
      Object.entries(features).map(([key, { emoji, name }]) => ({
        label: name,
        value: key,
        emoji,
        description: status(guild.id, key).missing?.slice(0, 100),
      })),
    );
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] };
}

function featurePanel(guild, feature, notice) {
  const { emoji, name, description, settings } = features[feature];
  const { label, missing } = status(guild.id, feature);
  const on = isSwitchedOn(guild.id, feature);

  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle(`${emoji} ${name}`)
    .setDescription(`${description}\n\n**Status:** ${label}${missing ? ` (${missing})` : ''}`)
    .addFields(settings.map((key) => ({ name: settingDefinitions[key].label, value: describe(guild, key) })));
  if (notice) embed.setFooter({ text: notice });

  const rows = [];
  for (const key of settings) {
    const { kind, label, multiple, types } = settingDefinitions[key];
    const ids = currentItems(guild, key).map((item) => item.id);
    const menu =
      kind === 'role'
        ? new RoleSelectMenuBuilder().setDefaultRoles(ids)
        : new ChannelSelectMenuBuilder().setChannelTypes(types).setDefaultChannels(ids);
    rows.push(
      new ActionRowBuilder().addComponents(
        menu.setCustomId(`setup:set:${key}`).setPlaceholder(label).setMinValues(0).setMaxValues(multiple ? 25 : 1),
      ),
    );
  }
  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`setup:toggle:${feature}`)
        .setLabel(on ? 'Desativar' : 'Ativar')
        .setStyle(on ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder().setCustomId('setup:hub').setLabel('Voltar').setEmoji('⬅️').setStyle(ButtonStyle.Secondary),
    ),
  );

  return { embeds: [embed], components: rows };
}

export async function execute(interaction) {
  await interaction.reply({ ...hubPanel(interaction.guild), flags: MessageFlags.Ephemeral });
}

export async function handleComponent(interaction, action, arg) {
  // the panels outlive a permission change, and the setup invitation is posted publicly
  if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: 'Opa! você precisa da permissão **Gerenciar Servidor** para isso..', flags: MessageFlags.Ephemeral });
  }
  const { guild } = interaction;

  switch (action) {
    // the button on the setup invitation
    case 'open':
      return interaction.reply({ ...hubPanel(guild), flags: MessageFlags.Ephemeral });

    case 'hub':
      return interaction.update(hubPanel(guild));

    case 'feature':
      return interaction.update(featurePanel(guild, interaction.values[0]));

    case 'toggle': {
      const on = !isSwitchedOn(guild.id, arg);
      await setSwitchedOn(guild.id, arg, on);
      const notice = !on ? 'Desativada' : missingSettings(guild.id, arg).length ? 'Ligada: escolha o que falta para ela começar a funcionar' : '✅ Ativada';
      return interaction.update(featurePanel(guild, arg, notice));
    }

    case 'set': {
      await setSetting(guild.id, arg, settingDefinitions[arg].multiple ? interaction.values : (interaction.values[0] ?? null));
      return interaction.update(featurePanel(guild, featureOf(arg), '✅ Salvo'));
    }
  }
}
