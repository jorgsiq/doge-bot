import { EmbedBuilder, Events } from 'discord.js';
import config from '../config.js';
import { isEnabled } from '../lib/settings.js';
import { memberEmbed, postUpdate } from '../lib/updates.js';

export const name = Events.GuildMemberAdd;

export async function execute(member) {
  const { guild } = member;
  if (member.user.bot || !isEnabled(guild.id, 'welcome')) return;

  await postUpdate(
    guild,
    memberEmbed(member)
      .setColor(config.colors.doge)
      .setTitle('Bem-vindo(a)!')
      .setThumbnail(member.displayAvatarURL({ size: 1024 }))
      .setDescription(`@**${member.user.username}** acabou de entrar na ${guild.name}!`)
      .setImage(config.images.enter),
    member.user,
  );

  // the rules channel Discord gives Community servers
  const rules = guild.rulesChannelId ? `Antes de embarcar nessa jornada não esqueça de ler as regras em <#${guild.rulesChannelId}>\n\n` : '';
  const welcome = new EmbedBuilder()
    .setColor(config.colors.doge)
    .setTitle(`Fala, @${member.user.username}!`)
    .setDescription(
      `É bom saber que agora você também faz parte da **${guild.name}**!\n\n${rules}Se precisar de ajuda ou tiver algum problema é só chamar alguém da staff. Espero que se divirta!`,
    )
    .setImage(member.displayAvatarURL({ size: 1024 }));
  // members with closed DMs simply don't get the message
  await member.send({ embeds: [welcome] }).catch(() => {});
}
