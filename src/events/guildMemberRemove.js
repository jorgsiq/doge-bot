import { Events } from 'discord.js';
import config from '../config.js';
import { pick } from '../lib/random.js';
import { guildT } from '../lib/settings.js';
import { memberEmbed, postUpdate } from '../lib/updates.js';

export const name = Events.GuildMemberRemove;

export async function execute(member) {
  if (member.user.bot) return;

  const t = guildT(member.guild.id);
  await postUpdate(
    member.guild,
    memberEmbed(member)
      .setColor(config.colors.grey)
      .setTitle(t('guildMemberRemove.title'))
      .setThumbnail(member.displayAvatarURL({ size: 1024 }))
      .setDescription(t('guildMemberRemove.description', { user: member.user.username }))
      .setImage(pick(config.images.exit)),
  );
}
