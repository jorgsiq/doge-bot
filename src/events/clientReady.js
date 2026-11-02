import { Events } from 'discord.js';
import { scheduleDailyCleanup } from '../lib/cleanup.js';
import { startGameAlerts } from '../lib/gameAlerts.js';
import { sendSetupInvite } from '../lib/onboarding.js';
import { keepStatus } from '../lib/presence.js';
import { wasWelcomed } from '../lib/settings.js';
import { startShibaOfTheDay } from '../lib/shiba.js';
import { cleanupRooms } from '../lib/tempVoice.js';

export const name = Events.ClientReady;
export const once = true;

// each step is independent: one failing (say, a missing permission) must not keep the others from starting
const step = (label, task) => Promise.resolve().then(task).catch((error) => console.error(`Startup: failed to ${label}:`, error));

export async function execute(client) {
  keepStatus(client);
  scheduleDailyCleanup(client);
  startGameAlerts(client);
  startShibaOfTheDay(client);

  // global commands work in every server the bot is in; the bulk overwrite is idempotent, so it runs on every boot
  await step('register slash commands', () => client.application.commands.set(client.commands.map((command) => command.data)));
  await step('clean up temporary rooms', () => cleanupRooms(client));

  for (const guild of client.guilds.cache.values()) {
    // cache every member so profile updates and departures can be compared
    await step(`cache members of ${guild.name}`, () => guild.members.fetch());
    // servers that got the bot while it was offline, or before setup existed
    if (!wasWelcomed(guild.id)) await step(`invite ${guild.name} to set up`, () => sendSetupInvite(guild));
  }

  console.log(`Online as ${client.user.tag} with ${client.commands.size} commands in ${client.guilds.cache.size} servers`);
}
