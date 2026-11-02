import { Events } from 'discord.js';
import { logAvatarChange, logNameChange } from '../lib/updates.js';

export const name = Events.UserUpdate;

// global display name and avatar, logged in every server the user is in, unless a server-specific one hides them
export async function execute(oldUser, newUser) {
  if (newUser.bot) return;

  for (const guild of newUser.client.guilds.cache.values()) {
    const member = guild.members.cache.get(newUser.id);
    if (!member) continue;

    if (oldUser.displayName !== newUser.displayName && !member.nickname) {
      await logNameChange(member, oldUser.displayName, newUser.displayName);
    }
    if (oldUser.avatar !== newUser.avatar && !member.avatar) {
      await logAvatarChange(member, oldUser.displayAvatarURL({ size: 1024 }), newUser.displayAvatarURL({ size: 1024 }));
    }
  }
}
