const Discord = require('discord.js');
const values = require('./../values');
const execute = (bot, msg, args) => {
    let role = msg.member.guild.roles.cache.find(role => role.name === "Subscriber");
    /*if member does have the role "subscribed members" then unsubscribe*/
    if (msg.member.roles.cache.some(role => role.name === 'Subscriber')) {
        msg.member.roles.remove(role);

        //build embed
        const message = new Discord.MessageEmbed()
            .setTitle("Inscrição Removida")
            .setColor(values.colorGrey)
            .setAuthor(msg.member.user.tag, msg.member.user.displayAvatarURL())
            .setDescription("Você não irá receber alertas de promoções, jogos gratuitos e notícias na sua conta")
            .setTimestamp()
            .setFooter("Inscrição Encerrada ")


        setTimeout(function () {
            msg.delete().catch((error) => {
                console.error('Failed task with the following error:', error);
            });
        }, 300000);
        return msg.reply(message).then(msg => {
            setTimeout(() => msg.delete(), 300000)
        }).catch((error) => {
            console.error('Failed task with the following error:', error);
        });

    }
    else {
        msg.delete().catch((error) => {
            console.error('Failed task with the following error:', error);
        });

        return msg.reply("Opa! parece que você não possui uma inscrição nossa newsletter..").then(msg => {
            setTimeout(() => msg.delete(), 10000)
        }).catch((error) => {
            console.error('Failed task with the following error:', error);
        });

    }
};

module.exports = {
    name: "unsubscribe",
    help: "\n (Games Alert) você desativa o alerta de jogos grátis",
    execute,
};