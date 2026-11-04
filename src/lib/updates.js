import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import config from '../config.js';
import { avatarChangeImage } from './avatarImages.js';
import { getSetting, isEnabled } from './settings.js';

// Posts to the server's updates channel, pinging the member when given. Never throws: it is only a log.
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
    .setFooter({ text: `ID do Usuário: ${member.id}` });
}

export function logNameChange(member, before, after) {
  const embed = memberEmbed(member)
    .setColor(config.colors.doge)
    .setDescription('Teve seu **nickname** alterado')
    .addFields(
      { name: `@${before}`, value: 'Antes', inline: true },
      { name: `@${after}`, value: 'Agora', inline: true },
    );
  return postUpdate(member.guild, embed, member.user);
}

// Before and after in a single picture, sent along with the message, so the old avatar stays in the log once Discord
// deletes it
export async function logAvatarChange(member, beforeUrl, afterUrl) {
  if (!isEnabled(member.guild.id, 'welcome')) return;
  const embed = memberEmbed(member).setColor(config.colors.doge).setDescription('Teve sua **foto** de perfil alterada\n\n(Antes e depois)');
  let files = [];
  try {
    files = [new AttachmentBuilder(await avatarChangeImage(beforeUrl, afterUrl), { name: 'avatar.png' })];
    embed.setImage('attachment://avatar.png');
  } catch (error) {
    // the picture links instead: the old avatar small in the corner, the new one big
    console.error('Failed to draw the avatar change:', error);
    embed.setThumbnail(beforeUrl).setImage(afterUrl);
  }
  return postUpdate(member.guild, embed, member.user, files);
}
