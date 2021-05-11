const Discord = require("discord.js");

/**
 * --------------------------------------------------------------------------------------------------------------------New Member
 */
const newUserMessage = (bot, member) => {

    const updateMessage = new Discord.MessageEmbed()
        .setAuthor(member.user.tag, member.user.displayAvatarURL())
        .setColor("#EFE3CA")
        .setTitle("Bem-vindo(a)!")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
        .setDescription(`@**${member.user.username}** acabou de entrar na Đoge Style!`)
        .setImage(`https://i.imgur.com/e0VcfdL.gif`)
        .setFooter(`ID do Usuário: ${member.user}`)

    bot.channels.cache.get("750728830355767296").send(`${member.user}`).then(msg => {
        setTimeout(() => msg.delete(), 1800000)
      });
    bot.channels.cache.get("750728830355767296").send(updateMessage);
    console.log(`(NEW ACTIVITY): new member update message has sent in the server`);
};

const newUserUpdate = (member) => {
  
    const welcomeMessage = new Discord.MessageEmbed()
        .setColor('#EFE3CA')
        .setTitle(`Fala, @${member.user.username}!`)
        .setDescription(`É bom saber que agora você também faz parte da **Đoge Style!** \n\nAntes de embarcar nessa jornada não esqueça de ler nossas normas de convivência fixadas no canal de texto **#rules**\n\nSe precisar de ajuda ou tiver algum problema é só chamar por um **@Staff** em qualquer um dos canais. Espero que se divirta!`)
        .setImage("https://i.imgur.com/oELNH2p.gif")
    member.send(welcomeMessage);

    const offerMessage = new Discord.MessageEmbed()
        .setColor('#5dbea6')
        .setTitle(`Receba Alertas de Jogos Grátis!`)
        .setDescription(`ㅤ
        Ative as notificações via mensagem direta para receber alertas de grandes descontos e jogos que estejam **gratuitos**, isso incluí os títulos mensais da **Epic Store** e também promoções nas grandes lojas: **Steam**, **Playstation**, **Xbox** e **Nintendo**. Bacana, não?!
        
        Se você deseja se inscrever nesse serviço, basta executar o comando "**?subscribe**" no canal #commands para se tornar instantaneamente um assinante..
        ㅤ`)
        .setImage("https://i.imgur.com/F3WjZB5.png")
    setTimeout(function () {
        member.send(offerMessage);
    }, 600000);
    console.log(`(NEW ACTIVITY): new member welcome private message has sent to @${member.user.username}`);
};

/**
 * --------------------------------------------------------------------------------------------------------------------
 */

/**
 * --------------------------------------------------------------------------------------------------------------------Member Removed
 */
const memberRemoved = (bot, member) => {
    let myrandom = Math.round(Math.random() * 2);
    let links = new Array();
    links[0] = "https://i.imgur.com/B3ZEsgX.gif";
    links[1] = "https://i.imgur.com/nU0Liaq.gif";
    links[2] = "https://i.imgur.com/JkYBPUf.gif";

    const updateMessage = new Discord.MessageEmbed()
        .setAuthor(member.user.tag, member.user.displayAvatarURL())
        .setColor('#8c8c8c')
        .setTitle(`Ah Não!`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
        .setDescription(`@**${member.user.username}** nos abandonou!`)
        .setImage(`${links[myrandom]}`)
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
        .setColor('#EFE3CA')
        .setDescription("Teve seu **nickname** alterado\nㅤ ㅤ")
        .setImage(newMember.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
        .addFields(
            { name: `@${oldMember.displayName}`, value: `Antes`, inline: true },
            { name: `@${newMember.displayName}`, value: 'Agora', inline: true },
        )
        .setFooter(`ID do Usuário: ${newMember.user}`)
    bot.channels.cache.get("750728830355767296").send(`${newMember.user}`).then(msg => {
        setTimeout(() => msg.delete(), 1800000)
      });
    bot.channels.cache.get("750728830355767296").send(updateMessage);
    console.log(`(NEW ACTIVITY): nickname changed update message has sent in the server`);
};

const photoUpdate = (bot, oldMember, newMember) => {
    const updateMessage = new Discord.MessageEmbed()
        .setAuthor(newMember.user.tag, newMember.user.displayAvatarURL())
        .setColor('#EFE3CA')
        .setDescription(`Teve sua **foto** de perfil alterada\n\n(Nova foto de perfil)`)
        .setImage(newMember.user.displayAvatarURL({ dynamic: true, format: "png" }))
        .setThumbnail(oldMember.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
        .setFooter(`ID do Usuário: ${newMember.user}`)
    bot.channels.cache.get("750728830355767296").send(`${newMember.user}`).then(msg => {
        setTimeout(() => msg.delete(), 1800000)
      });
    bot.channels.cache.get("750728830355767296").send(updateMessage);
    console.log(`(NEW ACTIVITY): update photo message has sent in the server`);
};
/**
 * --------------------------------------------------------------------------------------------------------------------
 */


/**
 * --------------------------------------------------------------------------------------------------------------------Update
 */
const notify = (bot, message) => {
    console.log(`(NEW ACTIVITY): new update sent in channel #updates by @${message.author.username}`);
    //if the message has an attachment, it will be collected by messageAttachment, else it gets a null state
    let messageAttachment = message.attachments.size > 0 ? message.attachments.array()[0].url : null;
    const update = new Discord.MessageEmbed()
        .setTitle("Nova Atualização!")
        .setColor('#5dbea6')
        .setDescription(message.content)
        .setTimestamp()
        .setFooter(`Por: @${message.author.tag}`)
    //if the past message had an attachment, it will set in the embed image content
    if (messageAttachment) {
        update.setImage(messageAttachment);
    }

    bot.channels.cache.get("750472762367279245").send("@everyone").then(msg => {
        setTimeout(() => msg.delete(), 1800000)
      });;
    bot.channels.cache.get("750472762367279245").send(update);
}
/**
 * --------------------------------------------------------------------------------------------------------------------
 */

module.exports = { newUserMessage, newUserUpdate, memberRemoved, usernameUpdate, photoUpdate, notify };