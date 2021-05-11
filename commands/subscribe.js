const Discord = require('discord.js');
const execute = (bot, msg, args) => {
    let role = msg.member.guild.roles.cache.find(role => role.name === "Subscriber");
    /*if member does not have the role "subscribed members" then subscribe*/
    if (!msg.member.roles.cache.some(role => role.name === 'Subscriber')) {
        msg.member.roles.add(role);
        console.log(`(NEW ACTIVITY): @${msg.member.user.username} has now the role ${role.name}`);

        //build embed
        const message = new Discord.MessageEmbed()
            .setTitle("Nova Inscrição")
            .setColor('#EFE3CA')
            .setAuthor(msg.member.user.tag, msg.member.user.displayAvatarURL())
            .setDescription("você irá receber alertas de promoções, jogos gratuitos e notícias direto na sua conta")
            .setTimestamp()
            .setFooter("Inscrição Iniciada ")

        console.log(`(NEW ACTIVITY): subscription message sent on the server`);
        setTimeout(function () {
            msg.delete();
        }, 300000);
        return msg.reply(message).then(msg => {
            setTimeout(() => msg.delete(), 300000)
        });
    }
    else {
        console.log(`(NEW ACTIVITY): stop playing`);
        msg.delete();

        return msg.reply("opa! parece que você já é um inscrito na nossa newsletter..").then(msg => {
            setTimeout(() => msg.delete(), 10000)
        });

    }
};

module.exports = {
    name: "subscribe",
    help: "você ativa o alerta de jogos grátis",
    execute,
};