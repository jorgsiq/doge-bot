import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import config from '../config.js';
import { legalRow } from './legal.js';
import { guildT, markWelcomed } from './settings.js';

const { EmbedLinks, SendMessages, ViewChannel } = PermissionFlagsBits;

export async function sendSetupInvite(guild) {
  const me = guild.members.me;
  const t = guildT(guild.id);
  const canPost = (channel) =>
    channel?.type === ChannelType.GuildText && channel.permissionsFor(me).has([ViewChannel, SendMessages, EmbedLinks]);
  let channel;
  if (canPost(guild.systemChannel)) {
    channel = guild.systemChannel;
  } else {
    channel = guild.channels.cache
      .filter(canPost)
      .sort((a, b) => a.rawPosition - b.rawPosition)
      .first();
  }

  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle(t('onboarding.title', { server: guild.name }).slice(0, 256))
    .setThumbnail(config.images.dogeIcon)
    .setDescription(t(channel ? 'onboarding.description' : 'onboarding.noChannel', { server: guild.name }))
    .setFooter({ text: t('onboarding.footer') });

  if (channel) {
    const button = new ButtonBuilder()
      .setCustomId('setup:open')
      .setLabel(t('onboarding.button'))
      .setEmoji('⚙️')
      .setStyle(ButtonStyle.Primary);
    await channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(button), legalRow(t)] });
  } else {
    const owner = await guild.fetchOwner();
    await owner.send({ embeds: [embed], components: [legalRow(t)] });
  }
  await markWelcomed(guild.id);
}
