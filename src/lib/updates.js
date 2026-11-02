import { EmbedBuilder } from 'discord.js';
import config from '../config.js';
import { getSetting, isEnabled } from './settings.js';

// Posts to the server's updates channel, pinging the member when given. Never throws: it is only a log.
export async function postUpdate(guild, embed, user) {
  if (!isEnabled(guild.id, 'welcome')) return;
  try {
    const channel = await guild.channels.fetch(getSetting(guild.id, 'updatesChannel'));
    await channel.send({ content: user ? `${user}` : undefined, embeds: [embed] });
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

export function logAvatarChange(member, beforeUrl, afterUrl) {
  const embed = memberEmbed(member)
    .setColor(config.colors.doge)
    .setDescription('Teve sua **foto** de perfil alterada\n\n(Nova foto de perfil)')
    .setThumbnail(beforeUrl)
    .setImage(afterUrl);
  return postUpdate(member.guild, embed, member.user);
}
