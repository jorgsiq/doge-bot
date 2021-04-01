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
            .setColor('#ffb361')
            .setAuthor(msg.member.user.tag, msg.member.user.displayAvatarURL())
            .setDescription("você irá receber alertas de promoções, jogos gratuítos e notícias direto na sua conta")
            .setTimestamp()
            .setFooter("Inscrição Iniciada ")
        msg.reply(message);
        console.log(`(NEW ACTIVITY): subscription message sent on the server`);
    }
    else {
        msg.reply("opa! parece que você já é um inscrito na nossa newsletter..");
    }
};

module.exports = {
    name: "subscribe",
    help: "você ativa o alerta de jogos grátis",
    execute,
};