import { Events } from 'discord.js';
import { sendSetupInvite } from '../lib/onboarding.js';
import { wasWelcomed } from '../lib/settings.js';

export const name = Events.GuildCreate;

export async function execute(guild) {
  await guild.members.fetch();
  if (!wasWelcomed(guild.id)) await sendSetupInvite(guild);
}
