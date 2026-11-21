import { PermissionFlagsBits } from 'discord.js';
import { features, getRole, settingDefinitions, settingItems } from './settings.js';

const { MentionEveryone } = PermissionFlagsBits;

const needsOf = (guild, key) => {
  const { needs } = settingDefinitions[key];
  if (key === 'alertsChannel' && getRole(guild, 'subscriberRole')?.mentionable === false) return [...needs, MentionEveryone];
  return needs;
};

const featureNeeds = (feature) => [
  ...(features[feature].needs ?? []),
  ...features[feature].settings.flatMap((key) => settingDefinitions[key].needs ?? []),
];

const serverNeeds = [...new Set(Object.keys(features).flatMap(featureNeeds))];

export function serverProblems(guild) {
  const me = guild.members.me;
  if (!me) return [];
  return me.permissions.missing(serverNeeds).map((permission) => ({
    permission,
    features: Object.keys(features).filter((feature) => featureNeeds(feature).includes(PermissionFlagsBits[permission])),
  }));
}

export function channelProblems(guild, feature) {
  const me = guild.members.me;
  const problems = [];
  if (!me) return problems;
  for (const key of features[feature].settings) {
    if (!settingDefinitions[key].needs) continue;
    for (const channel of settingItems(guild, key)) {
      const missing = channel.permissionsFor(me).missing(needsOf(guild, key));
      if (missing.length) problems.push({ channel, missing });
    }
  }
  return problems;
}
