const Discord = require('discord.js');
const values = require('./../values');
const execute = (bot, msg, args) => {
    let role = msg.member.guild.roles.cache.find(role => role.name === "Subscriber");
    /*if member does not have the role "subscribed members" then subscribe*/
    if (!msg.member.roles.cache.some(role => role.name === 'Subscriber')) {
        msg.member.roles.add(role);


        //build embed
        const message = new Discord.MessageEmbed()
            .setTitle("Nova Inscrição")
            .setColor(values.colorDoge)
            .setAuthor(msg.member.user.tag, msg.member.user.displayAvatarURL())
            .setDescription("Você irá receber alertas de promoções, jogos gratuitos e notícias direto na sua conta")
            .setTimestamp()
            .setFooter("Inscrição Iniciada ")

        const update = new Discord.MessageEmbed()
            .setTitle("Novo Assinante")
            .setColor(values.colorDoge)
            .setAuthor(msg.member.user.tag, msg.member.user.displayAvatarURL())
            .setDescription("Agora é um assinante do alerta de promoções e notícias!")
            .setFooter(`ID do Usuário: ${msg.author.id}`)

        bot.channels.cache.get(values.updatesChannelId).send(`${msg.member.user}`).then(msg => {
            setTimeout(() => msg.delete(), 1800000)
        });
        bot.channels.cache.get(values.updatesChannelId).send(update);
     

        setTimeout(function () {
            msg.delete();
        }, 300000);
        return msg.reply(message).then(msg => {
            setTimeout(() => msg.delete(), 300000)
        });
    }
    else {
    
        msg.delete();

        return msg.reply("Opa! parece que você já é um inscrito na nossa newsletter..").then(msg => {
            setTimeout(() => msg.delete(), 10000)
        });

    }
};

module.exports = {
    name: "subscribe",
    help: "\n (Games Alert) você ativa o alerta de jogos grátis",
    execute,
};