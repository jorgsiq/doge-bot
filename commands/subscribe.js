const Discord = require('discord.js');
const execute = (bot, msg, args) => {
    let role = msg.member.guild.roles.cache.find(role => role.name === "Subscribed");

    if (!msg.member.roles.cache.has(role)) {
        msg.member.roles.add(role);
        console.log(`(NEW ACTIVITY): @${msg.member.username} has now the role ${role}`);
        const message = new Discord.MessageEmbed()
            .setTitle("Nova Inscrição")
            .setColor('#ff9900')
            .setAuthor(msg.member.user.tag, msg.member.user.displayAvatarURL())
            .setDescription("você irá receber alertas de promoções, jogos gratuítos e notícias direto na sua conta")
            .setTimestamp()
            .setFooter("Inscrição Iniciada ")
        msg.reply(message);
    }
    //simple
    else{
        msg.reply("opa! parece que você já é um inscrito da nossa newsletter..");
    }
};

module.exports ={
    name: "subscribe",
    help: "você ativa o alerta de jogos grátis",
    execute,
};