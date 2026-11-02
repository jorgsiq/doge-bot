import { Events } from 'discord.js';
import config from '../config.js';
import { memberEmbed, postUpdate } from '../lib/updates.js';

export const name = Events.GuildMemberRemove;

export async function execute(member) {
  if (member.user.bot) return;

  const images = config.images.exit;
  await postUpdate(
    member.guild,
    memberEmbed(member)
      .setColor(config.colors.grey)
      .setTitle('Ah Não!')
      .setThumbnail(member.displayAvatarURL({ size: 1024 }))
      .setDescription(`@**${member.user.username}** nos abandonou!`)
      .setImage(images[Math.floor(Math.random() * images.length)]),
  );
}
