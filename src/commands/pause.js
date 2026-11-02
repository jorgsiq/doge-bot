import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { controllableQueue, statusEmbed } from '../lib/music.js';

export const category = 'Music Player';
export const feature = 'music';

export const data = new SlashCommandBuilder()
  .setName('pause')
  .setDescription('Você pausa a música em reprodução')
  .setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const queue = await controllableQueue(interaction);
  if (!queue) return;

  if (queue.paused) {
    return interaction.reply({ content: 'Opa! a música já está pausada, use **/resume** para continuar..', flags: MessageFlags.Ephemeral });
  }
  // only a track that is actually playing can be paused (not one still loading)
  if (!queue.pause()) {
    return interaction.reply({ content: 'Opa! a música ainda está carregando, tente de novo em instantes..', flags: MessageFlags.Ephemeral });
  }

  await interaction.reply({
    embeds: [statusEmbed('Música em Pause', `A trilha atual foi pausada por ${interaction.user}`, config.images.music.pause)],
  });
}
