import { readdir } from 'node:fs/promises';
import { Collection } from 'discord.js';

const commandsDir = new URL('../commands/', import.meta.url);

export async function loadCommands() {
  const commands = new Collection();
  const files = (await readdir(commandsDir)).filter((file) => file.endsWith('.js'));

  for (const file of files) {
    const command = await import(new URL(file, commandsDir));
    commands.set(command.data.name, command);
  }
  return commands;
}
