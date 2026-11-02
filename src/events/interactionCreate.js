import { Events, MessageFlags } from 'discord.js';
import { ensureEnabled } from '../lib/settings.js';

export const name = Events.InteractionCreate;

export async function execute(interaction) {
  const { commands } = interaction.client;

  // buttons and select menus use "<command name>:<arguments...>" as custom id
  const [componentCommand, ...args] = interaction.isMessageComponent() ? interaction.customId.split(':') : [];
  const command = commands.get(interaction.commandName ?? componentCommand);

  try {
    if (!command) {
      if (interaction.isChatInputCommand()) {
        await interaction.reply({ content: 'Desculpe! eu ainda não aprendi esse truque..', flags: MessageFlags.Ephemeral });
      }
      return;
    }
    // commands of a feature switched off in /setup
    if (command.feature && !(await ensureEnabled(interaction, command.feature))) return;

    if (interaction.isChatInputCommand()) await command.execute(interaction);
    else if (interaction.isAutocomplete()) await command.autocomplete?.(interaction);
    else if (interaction.isMessageComponent()) await command.handleComponent?.(interaction, ...args);
  } catch (error) {
    console.error(`Error handling interaction ${interaction.commandName ?? interaction.customId}:`, error);
    if (!interaction.isRepliable()) return;
    const reply = { content: 'Desculpe! Ocorreu um erro..', flags: MessageFlags.Ephemeral };
    // a deferred reply is still showing "thinking...", so the error replaces it
    const respond = interaction.replied
      ? interaction.followUp(reply)
      : interaction.deferred
        ? interaction.editReply(reply.content)
        : interaction.reply(reply);
    await respond.catch(() => {});
  }
}
