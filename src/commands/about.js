import {
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
  TimestampStyles,
  time,
  version as discordJsVersion,
} from 'discord.js';
import pkg from '../../package.json' with { type: 'json' };
import config from '../config.js';

export const category = 'Info';

export const data = new SlashCommandBuilder()
  .setName('about')
  .setDescription('Mostra informações técnicas do bot')
  .setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const { client } = interaction;
  const embed = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle('Đoge Bot')
    .setDescription(
      `Eu sou o **Đoge Bot**: música, salas de voz temporárias, alertas de jogos grátis, boas-vindas e mais, cada função ativada pelos admins com **/setup**.\n\nSe você deseja conhecer ou colaborar com meu código fonte, ele está disponível neste repositório no [GitHub](${config.repositoryUrl})\n\nUtilize **/help** e descubra o que posso fazer!`,
    )
    .setImage(config.images.version)
    .addFields(
      { name: 'Versão', value: pkg.version, inline: true },
      { name: 'discord.js', value: discordJsVersion, inline: true },
      { name: 'Node.js', value: process.version, inline: true },
      { name: 'Online desde', value: time(client.readyAt, TimestampStyles.RelativeTime), inline: true },
      // -1 until the first heartbeat comes back
      { name: 'Latência', value: client.ws.ping >= 0 ? `${client.ws.ping} ms` : 'medindo...', inline: true },
      { name: 'Autor', value: '@jorgsiq', inline: true },
    )
    .setFooter({ text: `Precisa de ajuda? Contate: ${config.supportEmail}` });

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
