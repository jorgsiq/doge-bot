import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import config from '../config.js';
import { avatarChangeImage } from './avatarImages.js';
import { getSetting, guildT, isEnabled } from './settings.js';

export async function postUpdate(guild, embed, user, files = []) {
  if (!isEnabled(guild.id, 'welcome')) return;
  try {
    const channel = await guild.channels.fetch(getSetting(guild.id, 'updatesChannel'));
    await channel.send({ content: user ? `${user}` : undefined, embeds: [embed], files });
  } catch (error) {
    console.error('Failed to post to the updates channel:', error);
  }
}

export function memberEmbed(member) {
  return new EmbedBuilder()
    .setAuthor({ name: member.user.tag, iconURL: member.displayAvatarURL() })
    .setFooter({ text: guildT(member.guild.id)('updates.userId', { id: member.id }) });
}

export function logNameChange(member, before, after) {
  const t = guildT(member.guild.id);
  const embed = memberEmbed(member)
    .setColor(config.colors.doge)
    .setDescription(t('updates.nameChange.description'))
    .addFields(
      { name: `@${before}`, value: t('updates.nameChange.before'), inline: true },
      { name: `@${after}`, value: t('updates.nameChange.after'), inline: true },
    );
  return postUpdate(member.guild, embed, member.user);
}

// Before and after in one picture, so the old avatar stays in the log once Discord deletes it
export async function logAvatarChange(member, beforeUrl, afterUrl) {
  if (!isEnabled(member.guild.id, 'welcome')) return;
  const embed = memberEmbed(member)
    .setColor(config.colors.doge)
    .setDescription(guildT(member.guild.id)('updates.avatarChange.description'));
  let files = [];
  try {
    files = [new AttachmentBuilder(await avatarChangeImage(beforeUrl, afterUrl), { name: 'avatar.png' })];
    embed.setImage('attachment://avatar.png');
  } catch (error) {
    console.error('Failed to draw the avatar change:', error);
    embed.setThumbnail(beforeUrl).setImage(afterUrl);
  }
  return postUpdate(member.guild, embed, member.user, files);
}
