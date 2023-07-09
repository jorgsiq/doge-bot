const Discord = require("discord.js");
const values = require('./../values');
/**
 * --------------------------------------------------------------------------------------------------------------------New Member
 */
const newUserMessage = (bot, member) => {

    const updateMessage = new Discord.MessageEmbed()
        .setAuthor(member.user.tag, member.user.displayAvatarURL())
        .setColor(values.colorDoge)
        .setTitle("Bem-vindo(a)!")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
        .setDescription(`@**${member.user.username}** acabou de entrar na Đoge Style!`)
        .setImage(values.enterImageUrl)
        .setFooter(`ID do Usuário: ${member.user.id}`)

    bot.channels.cache.get(values.updatesChannelId).send(`${member.user}`).then(msg => {
        setTimeout(() => msg.delete(), 1800000)
    }).catch((error) => {
        console.error('Failed task with the following error:', error);
    });
    bot.channels.cache.get(values.updatesChannelId).send(updateMessage);

};

const newUserUpdate = (member) => {

    const welcomeMessage = new Discord.MessageEmbed()
        .setColor(values.colorDoge)
        .setTitle(`Fala, @${member.user.username}!`)
        .setDescription(`É bom saber que agora você também faz parte da **Đoge Style!** \n\nAntes de embarcar nessa jornada não esqueça de ler nossas normas de convivência fixadas no canal de texto **#rules**\n\nSe precisar de ajuda ou tiver algum problema é só chamar por um **@Staff** em qualquer um dos canais. Espero que se divirta!`)
        .setImage(member.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
    member.send(welcomeMessage);

    const offerMessage = new Discord.MessageEmbed()
        .setColor(values.colorGreen)
        .setTitle(`Receba Alertas de Jogos Grátis!`)
        .setDescription(`ㅤ
        Ative as notificações via mensagem direta para receber alertas de grandes descontos e jogos que estejam **gratuitos**, isso incluí os títulos mensais da **Epic Store** e também promoções nas grandes lojas: **Steam**, **Playstation**, **Xbox** e **Nintendo**. Bacana, não?!
        
        Se você deseja se inscrever nesse serviço, basta executar o comando "**?subscribe**" no canal #commands para se tornar instantaneamente um assinante..
        ㅤ`)
        .setImage(values.mobileImageUrl)
    setTimeout(function () {
        member.send(offerMessage);
    }, 600000);
};
/**
 * --------------------------------------------------------------------------------------------------------------------Member Removed
 */
const memberRemoved = (bot, member) => {
    //index 0 to 3
    let random = Math.round(Math.random() * 2);
    let imageLinks = [values.exitImageUrl, values.exitImage2Url, values.exitImage3Url];

    const updateMessage = new Discord.MessageEmbed()
        .setAuthor(member.user.tag, member.user.displayAvatarURL())
        .setColor(values.colorGrey)
        .setTitle(`Ah Não!`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
        .setDescription(`@**${member.user.username}** nos abandonou!`)
        .setImage(`${imageLinks[random]}`)
        .setFooter(`ID do Usuário: ${member.user.id}`)
    bot.channels.cache.get(values.updatesChannelId).send(updateMessage);
};
/**
 * --------------------------------------------------------------------------------------------------------------------Profile updates
 */
const usernameUpdate = (bot, oldMember, newMember) => {
    const updateMessage = new Discord.MessageEmbed()
        .setAuthor(newMember.user.tag, newMember.user.displayAvatarURL())
        .setColor(values.colorDoge)
        .setDescription("Teve seu **nickname** alterado\nㅤ ㅤ")
        .addFields(
            { name: `@${oldMember.displayName}`, value: `Antes`, inline: true },
            { name: `@${newMember.displayName}`, value: 'Agora', inline: true },
        )
        .setFooter(`ID do Usuário: ${newMember.user.id}`)
    bot.channels.cache.get(values.updatesChannelId).send(`${newMember.user}`).then(msg => {
        setTimeout(() => msg.delete(), 1800000)
    }).catch((error) => {
        console.error('Failed task with the following error:', error);
    });
    bot.channels.cache.get(values.updatesChannelId).send(updateMessage);
};

const photoUpdate = (bot, oldMember, newMember) => {
    const updateMessage = new Discord.MessageEmbed()
        .setAuthor(newMember.user.tag, newMember.user.displayAvatarURL())
        .setColor(values.colorDoge)
        .setDescription(`Teve sua **foto** de perfil alterada\n\n(Nova foto de perfil)`)
        .setImage(newMember.user.displayAvatarURL({ dynamic: true, format: "png" }))
        .setThumbnail(oldMember.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
        .setFooter(`ID do Usuário: ${newMember.user.id}`)
    bot.channels.cache.get(values.updatesChannelId).send(`${newMember.user}`).then(msg => {
        setTimeout(() => msg.delete(), 1800000)
    }).catch((error) => {
        console.error('Failed task with the following error:', error);
    });
    bot.channels.cache.get(values.updatesChannelId).send(updateMessage);

};
/**
 * --------------------------------------------------------------------------------------------------------------------Update
 */
const notify = (bot, message) => {
    //if the message has an attachment, it will be collected by messageAttachment, else it gets a null state
    let messageAttachment = message.attachments.size > 0 ? message.attachments.array()[0].url : null;
    const update = new Discord.MessageEmbed()
        .setTitle("Nova Atualização!")
        .setColor(values.colorGreen)
        .setDescription(message.content)
        .setTimestamp()
        .setFooter(`Por: @${message.author.tag}`)
    //if the past message had an attachment, it will set in the embed image content
    if (messageAttachment) {
        update.setImage(messageAttachment);
    }

    bot.channels.cache.get(values.alertsChannelId).send("@everyone").then(msg => {
        setTimeout(() => msg.delete(), 1800000)
    }).catch((error) => {
        console.error('Failed task with the following error:', error);
    });
    bot.channels.cache.get(values.alertsChannelId).send(update);

    return message.reply("Encaminhei a mensagem incorporada para o destino!");
}

const embed = (bot, message) => {
    let channelId = message.content.split(" ")[0];
    let content = message.content.substr(message.content.indexOf(" ") + 1);
    //if the message has an attachment, it will be collected by messageAttachment, else it gets a null state
    let messageAttachment = message.attachments.size > 0 ? message.attachments.array()[0].url : null;

    const update = new Discord.MessageEmbed()
        .setColor(values.colorDoge)
        .setDescription(content)
    //if the past message had an attachment, it will set in the embed image content
    if (messageAttachment) {
        update.setImage(messageAttachment);
    }


    bot.channels.cache.get(`${channelId}`).send(update);

    return message.reply("Encaminhei a mensagem incorporada para o destino!");
}
/**
 * --------------------------------------------------------------------------------------------------------------------
 */
module.exports = { newUserMessage, newUserUpdate, memberRemoved, usernameUpdate, photoUpdate, notify, embed };