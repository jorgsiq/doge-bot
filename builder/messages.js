const Discord = require("discord.js");

/**
 * --------------------------------------------------------------------------------------------------------------------New Member
 */
const newUserMessage = (bot, member) => {
    const updateMessage = new Discord.MessageEmbed()
        .setAuthor(member.user.tag, member.user.displayAvatarURL())
        .setColor("#ffb361")
        .setTitle("Bem-vindo(a)!")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
        .setDescription(`@**${member.user.username}** acabou de entrar na Đoge Style!`)
        .setImage("https://i.imgur.com/DmzdRAk.gif")
        .setFooter(`ID do Usuário: ${member.user}`)
    bot.channels.cache.get("750728830355767296").send(updateMessage);
    console.log(`(NEW ACTIVITY): new member update message has sent in the server`);
};

const newUserUpdate = (member) => {
    const welcomeMessage = new Discord.MessageEmbed()
        .setColor('#ffb361')
        .setTitle(`Fala, @${member.user.username}!`)
        .setDescription(`É bom saber que agora você também faz parte da Đoge Style! \n\nAntes de embarcar nessa jornada não esqueça de ler nossas normas de convivência fixadas no canal de texto <#${750567653407457380}>\n\nSe precisar de ajuda ou tiver algum problema é só chamar por um **@staff** em qualquer um dos canais. Espero que se divirta!`)
        .setImage("https://i.imgur.com/aKe6a1F.gif")
    member.send(welcomeMessage);
    console.log(`(NEW ACTIVITY): new member welcome private message has sent to @${member.user.username}`);
};
/**
 * --------------------------------------------------------------------------------------------------------------------
 */

/**
 * --------------------------------------------------------------------------------------------------------------------Member Removed
 */
const memberRemoved = (bot, member) => {
    const updateMessage = new Discord.MessageEmbed()
        .setAuthor(member.user.tag, member.user.displayAvatarURL())
        .setColor('#8c8c8c')
        .setTitle(`Ah Não!`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
        .setDescription(`@**${member.user.username}** nos abandonou!`)
        .setImage("https://i.imgur.com/cApLkJo.gif")
        .setFooter(`ID do Usuário: ${member.user}`)
    bot.channels.cache.get("750728830355767296").send(updateMessage);
    console.log(`(NEW ACTIVITY): removed member update has sent in the server`);
};
/**
 * --------------------------------------------------------------------------------------------------------------------
 */

/**
 * --------------------------------------------------------------------------------------------------------------------Profile updates
 */
const usernameUpdate = (bot, oldMember, newMember) => {
    const updateMessage = new Discord.MessageEmbed()
            .setAuthor(newMember.user.tag, newMember.user.displayAvatarURL())
            .setColor('#ffb361')
            .setDescription("Teve seu **nickname** alterado\nㅤ ㅤ")
            .setImage(newMember.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
            .addFields(
                { name: `@${oldMember.displayName}`, value: `Antes`, inline: true },
                { name: `@${newMember.displayName}`, value: 'Agora', inline: true },
            )
            .setFooter(`ID do Usuário: ${newMember.user}`)
        bot.channels.cache.get("750728830355767296").send(updateMessage);
        console.log(`(NEW ACTIVITY): nickname changed update message has sent in the server`);
};

const photoUpdate = (bot, oldMember, newMember) => {
    const updateMessage = new Discord.MessageEmbed()
            .setAuthor(newMember.user.tag, newMember.user.displayAvatarURL())
            .setColor('#ffb361')
            .setDescription(`Teve sua **foto** de perfil alterada\n\n(Nova foto de perfil)`)
            .setImage(newMember.user.displayAvatarURL({ dynamic: true, format: "png" }))
            .setThumbnail(oldMember.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
            .setFooter(`ID do Usuário: ${newMember.user}`)
        bot.channels.cache.get("750728830355767296").send(updateMessage);
        console.log(`(NEW ACTIVITY): update photo message has sent in the server`);
};
/**
 * --------------------------------------------------------------------------------------------------------------------
 */

module.exports = { newUserMessage, newUserUpdate, memberRemoved, usernameUpdate, photoUpdate };