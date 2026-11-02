import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadCommands } from './lib/commands.js';
import { DEFAULT_ACTIVITY } from './lib/presence.js';

// the token lives in .env; hosting panels start the bot with a plain `node src/index.js`, so it is loaded here
if (existsSync('.env')) process.loadEnvFile();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    // the commands channel only needs to know who posted, not what: no Message Content intent
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
  // lets guildMemberRemove fire even for members missing from the cache
  partials: [Partials.GuildMember],
  presence: { activities: [DEFAULT_ACTIVITY] },
  // only user mentions ping by default; @everyone and roles must be allowed per message
  allowedMentions: { parse: ['users'] },
});

client.commands = await loadCommands();

const eventsDir = new URL('./events/', import.meta.url);
for (const file of await readdir(eventsDir)) {
  const event = await import(new URL(file, eventsDir));
  client[event.once ? 'once' : 'on'](event.name, (...args) =>
    Promise.resolve()
      .then(() => event.execute(...args))
      .catch((error) => console.error(`Error in ${event.name}:`, error)),
  );
}

// without these, a single stray error (a gateway hiccup, a forgotten catch) would take the whole bot down
client.on('error', (error) => console.error('Discord client error:', error));
process.on('unhandledRejection', (error) => console.error('Unhandled rejection:', error));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    await client.destroy();
    process.exit(0);
  });
}

await client.login(process.env.DISCORD_TOKEN);
