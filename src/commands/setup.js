import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  EmbedBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import config from '../config.js';
import { describe, languages } from '../lib/i18n.js';
import { ephemeral } from '../lib/replies.js';
import { channelProblems, serverProblems } from '../lib/permissions.js';
import {
  features,
  getLanguage,
  getRegion,
  guildT,
  isSetupDone,
  isSwitchedOn,
  markSetupDone,
  missingSettings,
  regionFlag,
  regionName,
  setSetting,
  setSwitchedOn,
  settingDefinitions,
  settingItems,
} from '../lib/settings.js';

export const category = 'admin';

export const data = describe(new SlashCommandBuilder().setName('setup'), 'setup')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setContexts(InteractionContextType.Guild);

const STEPS = 3;

const featureOf = (settingKey) => Object.keys(features).find((key) => features[key].settings.includes(settingKey));

const stepTitle = (t, step, name) => t('setup.wizard.step', { step, total: STEPS, name });

const permissionList = (t, names) => names.map((name) => t(`setup.permissionNames.${name}`)).join(', ');

const channelLines = (t, problems) => problems.map(({ channel, missing }) => `• ${channel} — ${permissionList(t, missing)}`);

function status(t, guild, feature) {
  if (!isSwitchedOn(guild.id, feature)) return { label: t('setup.status.inactive') };
  const missing = missingSettings(guild.id, feature);
  if (missing.length) {
    const settings = missing.map((key) => t(`setup.settings.${key}.name`)).join(', ');
    return { label: t('setup.status.incomplete'), missing: t('setup.status.missing', { settings }) };
  }
  if (channelProblems(guild, feature).length) return { label: t('setup.status.blocked') };
  return { label: t('setup.status.active') };
}

function describeSetting(t, guild, key) {
  if (settingDefinitions[key].kind === 'region') {
    const region = getRegion(guild.id);
    return `${regionFlag(region)} ${regionName(getLanguage(guild.id), region)}`;
  }
  const items = settingItems(guild, key);
  if (!items.length) return `**${settingDefinitions[key].empty ? t(`setup.settings.${key}.empty`) : t('setup.none')}**`;
  return items.join(', ').slice(0, 1024);
}

function languageMenu(t, guild, customId) {
  return new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(t('setup.hub.languagePlaceholder'))
    .addOptions(Object.entries(languages).map(([value, label]) => ({ label, value, default: value === getLanguage(guild.id) })));
}

function regionMenu(t, guild, customId) {
  const language = getLanguage(guild.id);
  return new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(t('setup.settings.region.label'))
    .addOptions(
      config.gameAlerts.regions.map((region) => ({
        label: regionName(language, region),
        value: region,
        emoji: regionFlag(region),
        default: region === getRegion(guild.id),
      })),
    );
}

export function hubPanel(guild, notice, intro = false) {
  const t = guildT(guild.id);
  // Discord has no tables: two inline fields side by side make one, with a single line per feature so the rows line up
  const rows = Object.keys(features).map((key) => ({ feature: t(`setup.features.${key}.name`), status: status(t, guild, key).label }));
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle(intro ? stepTitle(t, 3, t('setup.hub.stepName')) : t('setup.hub.title'))
    .setDescription(t(intro ? 'setup.hub.introDescription' : 'setup.hub.description'))
    .addFields(
      { name: t('setup.hub.feature'), value: rows.map((row) => row.feature).join('\n'), inline: true },
      { name: t('setup.hub.status'), value: rows.map((row) => row.status).join('\n'), inline: true },
    );
  if (notice) embed.setFooter({ text: notice });

  const featureMenu = new StringSelectMenuBuilder()
    .setCustomId('setup:feature')
    .setPlaceholder(t('setup.hub.placeholder'))
    .addOptions(
      Object.entries(features).map(([key, { emoji }]) => ({
        label: t(`setup.features.${key}.name`),
        value: key,
        emoji,
        description: status(t, guild, key).missing?.slice(0, 100),
      })),
    );
  const checkButton = new ButtonBuilder()
    .setCustomId('setup:permissions')
    .setLabel(t('setup.buttons.permissions'))
    .setEmoji('🔐')
    .setStyle(ButtonStyle.Secondary);
  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(featureMenu),
      new ActionRowBuilder().addComponents(languageMenu(t, guild, 'setup:language')),
      new ActionRowBuilder().addComponents(checkButton),
    ],
  };
}

function languagePanel(guild, notice) {
  const t = guildT(guild.id);
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle(stepTitle(t, 1, t('setup.language.title')))
    .setDescription(t('setup.language.description', { server: guild.name }));
  if (notice) embed.setFooter({ text: notice });
  const next = new ButtonBuilder()
    .setCustomId('setup:permissions')
    .setLabel(t('setup.buttons.next'))
    .setEmoji('➡️')
    .setStyle(ButtonStyle.Primary);
  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(languageMenu(t, guild, 'setup:language:step')),
      new ActionRowBuilder().addComponents(next),
    ],
  };
}

function permissionsPanel(guild) {
  const t = guildT(guild.id);
  const intro = !isSetupDone(guild.id);
  const server = serverProblems(guild).map(({ permission, features: used }) => {
    const names = used.map((feature) => t(`setup.features.${feature}.name`)).join(', ');
    return `• **${permissionList(t, [permission])}** — ${names}`;
  });
  const channels = Object.keys(features)
    .filter((feature) => isSwitchedOn(guild.id, feature))
    .flatMap((feature) => channelLines(t, channelProblems(guild, feature)));

  const parts = [t('setup.permissions.intro')];
  if (server.length) parts.push(t('setup.permissions.serverMissing', { list: server.join('\n') }));
  if (channels.length) parts.push(t('setup.permissions.channelsMissing', { list: channels.join('\n') }));
  parts.push(t(server.length || channels.length ? 'setup.permissions.fix' : 'setup.permissions.ok'));

  const title = t('setup.permissions.title');
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle(intro ? stepTitle(t, 2, title) : title)
    .setDescription(parts.join('\n\n').slice(0, 4096));
  const check = new ButtonBuilder()
    .setCustomId('setup:permissions')
    .setLabel(t('setup.buttons.check'))
    .setEmoji('🔄')
    .setStyle(ButtonStyle.Secondary);
  const onward = new ButtonBuilder()
    .setCustomId('setup:hub')
    .setLabel(t(intro ? 'setup.buttons.next' : 'setup.buttons.back'))
    .setEmoji(intro ? '➡️' : '⬅️')
    .setStyle(intro ? ButtonStyle.Primary : ButtonStyle.Secondary);
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(check, onward)] };
}

function entryPanel(guild) {
  return isSetupDone(guild.id) ? hubPanel(guild) : languagePanel(guild);
}

function featurePanel(guild, feature, notice) {
  const t = guildT(guild.id);
  const { emoji, settings } = features[feature];
  const { label, missing } = status(t, guild, feature);
  const on = isSwitchedOn(guild.id, feature);
  const problems = channelProblems(guild, feature);

  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle(`${emoji} ${t(`setup.features.${feature}.name`)}`)
    .setDescription(
      `${t(`setup.features.${feature}.description`)}\n\n${t('setup.status.label', { status: label })}${missing ? ` (${missing})` : ''}`,
    )
    .addFields(settings.map((key) => ({ name: t(`setup.settings.${key}.label`), value: describeSetting(t, guild, key) })));
  if (problems.length) {
    const lines = [...channelLines(t, problems), t('setup.permissions.channelHint')];
    embed.addFields({ name: t('setup.permissions.field'), value: lines.join('\n').slice(0, 1024) });
  }
  if (notice) embed.setFooter({ text: notice });

  const rows = [];
  for (const key of settings) {
    const { kind, multiple, types } = settingDefinitions[key];
    if (kind === 'region') {
      rows.push(new ActionRowBuilder().addComponents(regionMenu(t, guild, `setup:set:${key}`).setMinValues(1)));
      continue;
    }
    const ids = settingItems(guild, key).map((item) => item.id);
    let menu;
    if (kind === 'role') menu = new RoleSelectMenuBuilder().setDefaultRoles(ids);
    else menu = new ChannelSelectMenuBuilder().setChannelTypes(types).setDefaultChannels(ids);
    rows.push(
      new ActionRowBuilder().addComponents(
        menu
          .setCustomId(`setup:set:${key}`)
          .setPlaceholder(t(`setup.settings.${key}.label`))
          .setMinValues(0)
          .setMaxValues(multiple ? 25 : 1),
      ),
    );
  }
  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`setup:toggle:${feature}`)
        .setLabel(t(on ? 'setup.buttons.disable' : 'setup.buttons.enable'))
        .setStyle(on ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder().setCustomId('setup:hub').setLabel(t('setup.buttons.back')).setEmoji('⬅️').setStyle(ButtonStyle.Secondary),
    ),
  );

  return { embeds: [embed], components: rows };
}

export async function execute(interaction) {
  await interaction.reply(ephemeral(entryPanel(interaction.guild)));
}

export async function handleComponent(interaction, action, arg) {
  const { guild } = interaction;
  // the panels outlive a permission change, and the setup invitation is posted publicly
  if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply(ephemeral(guildT(guild.id)('setup.noPermission')));
  }

  switch (action) {
    case 'open':
      return interaction.reply(ephemeral(entryPanel(guild)));

    case 'permissions':
      return interaction.update(permissionsPanel(guild));

    case 'hub': {
      const intro = !isSetupDone(guild.id);
      if (intro) await markSetupDone(guild.id);
      return interaction.update(hubPanel(guild, undefined, intro));
    }

    case 'feature':
      return interaction.update(featurePanel(guild, interaction.values[0]));

    case 'language': {
      const [language] = interaction.values;
      if (!languages[language]) return;
      await setSetting(guild.id, 'language', language);
      const notice = guildT(guild.id)('setup.notices.language');
      return interaction.update(arg === 'step' ? languagePanel(guild, notice) : hubPanel(guild, notice));
    }

    case 'toggle': {
      const t = guildT(guild.id);
      const on = !isSwitchedOn(guild.id, arg);
      await setSwitchedOn(guild.id, arg, on);
      let notice;
      if (!on) notice = t('setup.notices.off');
      else if (missingSettings(guild.id, arg).length) notice = t('setup.notices.onIncomplete');
      else notice = t('setup.notices.on');
      return interaction.update(featurePanel(guild, arg, notice));
    }

    case 'set': {
      if (settingDefinitions[arg].kind === 'region' && !config.gameAlerts.regions.includes(interaction.values[0])) return;
      await setSetting(guild.id, arg, settingDefinitions[arg].multiple ? interaction.values : (interaction.values[0] ?? null));
      return interaction.update(featurePanel(guild, featureOf(arg), guildT(guild.id)('setup.notices.saved')));
    }
  }
}
