import { Events } from 'discord.js';
import { ephemeral } from '../lib/replies.js';
import { ensureEnabled, guildT } from '../lib/settings.js';

export const name = Events.InteractionCreate;

export async function execute(interaction) {
  const { commands } = interaction.client;
  const t = guildT(interaction.guildId);

  // buttons and select menus use "<command name>:<arguments...>" as custom id
  const [componentCommand, ...args] = interaction.isMessageComponent() ? interaction.customId.split(':') : [];
  const command = commands.get(interaction.commandName ?? componentCommand);

  try {
    if (!command) {
      if (interaction.isChatInputCommand()) await interaction.reply(ephemeral(t('common.unknownCommand')));
      return;
    }
    if (command.feature && !(await ensureEnabled(interaction, command.feature))) return;

    if (interaction.isChatInputCommand()) await command.execute(interaction);
    else if (interaction.isAutocomplete()) await command.autocomplete?.(interaction);
    else if (interaction.isMessageComponent()) await command.handleComponent?.(interaction, ...args);
  } catch (error) {
    console.error(`Error handling interaction ${interaction.commandName ?? interaction.customId}:`, error);
    if (!interaction.isRepliable()) return;
    const reply = ephemeral(t('common.error'));
    let respond;
    if (interaction.replied) respond = interaction.followUp(reply);
    else if (interaction.deferred) respond = interaction.editReply(reply.content);
    else respond = interaction.reply(reply);
    await respond.catch(() => {});
  }
}
