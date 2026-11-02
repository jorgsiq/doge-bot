import { Events } from 'discord.js';
import { logAvatarChange, logNameChange } from '../lib/updates.js';

export const name = Events.GuildMemberUpdate;

// server-specific nickname and avatar; global ones are handled in userUpdate
export async function execute(oldMember, newMember) {
  if (oldMember.partial || newMember.user.bot) return;

  if (oldMember.nickname !== newMember.nickname) {
    await logNameChange(newMember, oldMember.displayName, newMember.displayName);
  }
  if (oldMember.avatar !== newMember.avatar) {
    await logAvatarChange(newMember, oldMember.displayAvatarURL({ size: 1024 }), newMember.displayAvatarURL({ size: 1024 }));
  }
}
