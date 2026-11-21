import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { Client, GatewayIntentBits, Options, Partials } from 'discord.js';
import { loadCommands } from './lib/commands.js';
import { stopAll } from './lib/music.js';
import { DEFAULT_ACTIVITY } from './lib/presence.js';
import * as store from './lib/store.js';

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
  // Small plans have 256 MB and nothing reads old messages or reactions back, so they are not cached
  makeCache: Options.cacheWithLimits({ ...Options.DefaultMakeCacheSettings, MessageManager: 0, ReactionManager: 0 }),
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

client.on('error', (error) => console.error('Discord client error:', error));
process.on('unhandledRejection', (error) => console.error('Unhandled rejection:', error));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    stopAll();
    await Promise.all([client.destroy(), store.flush()]);
    process.exit(0);
  });
}

await client.login(process.env.DISCORD_TOKEN);
