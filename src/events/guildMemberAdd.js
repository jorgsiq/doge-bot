import { EmbedBuilder, Events } from 'discord.js';
import config from '../config.js';
import { guildT, isEnabled } from '../lib/settings.js';
import { memberEmbed, postUpdate } from '../lib/updates.js';

export const name = Events.GuildMemberAdd;

export async function execute(member) {
  const { guild } = member;
  if (member.user.bot || !isEnabled(guild.id, 'welcome')) return;
  const t = guildT(guild.id);

  await postUpdate(
    guild,
    memberEmbed(member)
      .setColor(config.colors.doge)
      .setTitle(t('guildMemberAdd.title'))
      .setThumbnail(member.displayAvatarURL({ size: 1024 }))
      .setDescription(t('guildMemberAdd.description', { user: member.user.username, server: guild.name }))
      .setImage(config.images.enter),
    member.user,
  );

  const rules = guild.rulesChannelId ? t('guildMemberAdd.dm.rules', { channel: guild.rulesChannelId }) : '';
  const welcome = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle(t('guildMemberAdd.dm.title', { user: member.user.username }))
    .setDescription(t('guildMemberAdd.dm.description', { server: guild.name, rules }))
    .setImage(member.displayAvatarURL({ size: 1024 }));
  await member.send({ embeds: [welcome] }).catch(() => {});
}
