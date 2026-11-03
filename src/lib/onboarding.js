import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import config from '../config.js';
import { markWelcomed } from './settings.js';

const { EmbedLinks, SendMessages, ViewChannel } = PermissionFlagsBits;

// Invites the server's admins to set the bot up: in the system channel, else the first channel the bot can post in, else the owner's DMs
export async function sendSetupInvite(guild) {
  const me = guild.members.me;
  const canPost = (channel) => channel?.type === ChannelType.GuildText && channel.permissionsFor(me).has([ViewChannel, SendMessages, EmbedLinks]);
  const channel = canPost(guild.systemChannel)
    ? guild.systemChannel
    : guild.channels.cache.filter(canPost).sort((a, b) => a.rawPosition - b.rawPosition).first();

  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle(`👋 Olá, ${guild.name}!`.slice(0, 256))
    .setThumbnail(config.images.dogeIcon)
    .setDescription(
      'Eu sou o **Đoge Bot**: música, salas de voz temporárias, alertas de jogos grátis, boas-vindas e mais.\n\n' +
        'Cada função pode ser ativada ou desativada. Fora a música e as interações, todas começam desligadas até um admin configurá-las.\n\n' +
        'Clique em **Configurar** ou use **/setup** a qualquer momento.',
    )
    .setFooter({ text: 'Só quem pode gerenciar o servidor consegue configurar' });

  if (channel) {
    const button = new ButtonBuilder().setCustomId('setup:open').setLabel('Configurar').setEmoji('⚙️').setStyle(ButtonStyle.Primary);
    await channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(button)] });
  } else {
    // a button can't open the server's setup from a DM, so the owner is pointed to /setup
    const owner = await guild.fetchOwner();
    await owner.send({ embeds: [embed] });
  }
  await markWelcomed(guild.id);
}
