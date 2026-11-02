import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import config from '../config.js';
import { controllableQueue, statusEmbed } from '../lib/music.js';

export const category = 'Music Player';
export const feature = 'music';

export const data = new SlashCommandBuilder()
  .setName('skip')
  .setDescription('Você avança para a próxima música da fila')
  .setContexts(InteractionContextType.Guild);

export async function execute(interaction) {
  const queue = await controllableQueue(interaction);
  if (!queue) return;

  // the queue exists while the bot is still connecting, before its first track
  const skipped = queue.current;
  if (!skipped) {
    return interaction.reply({ content: 'Opa! ainda não comecei a tocar, espere um instante..', flags: MessageFlags.Ephemeral });
  }
  queue.skip();
  await interaction.reply({
    embeds: [statusEmbed('Próxima Música', `${interaction.user} pulou **${skipped.title}**`, config.images.music.skip)],
  });
}
