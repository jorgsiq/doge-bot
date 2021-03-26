const Discord = require('discord.js');
const execute = (bot, msg, args) => {
    let role = msg.member.guild.roles.cache.find(role => role.name === "Subscribed");
    /*if member does have the role os subscribed members then subscribe*/
    if (msg.member.roles.cache.some(role => role.name === 'Subscribed')) {
        msg.member.roles.remove(role);
        console.log(`(NEW ACTIVITY): @${msg.member.user.username} has no more the role ${role.name}`);

        const message = new Discord.MessageEmbed()
            .setTitle("Inscrição Removida")
            .setColor('#8c8c8c')
            .setAuthor(msg.member.user.tag, msg.member.user.displayAvatarURL())
            .setDescription("você não irá receber alertas de promoções, jogos gratuítos e notícias na sua conta")
            .setTimestamp()
            .setFooter("Inscrição Encerrada ")
        msg.reply(message);
    }
    else{
        msg.reply("opa! parece que você não possui uma inscrição nossa newsletter..");
    }
};

module.exports = {
    name: "unsubscribe",
    help: "você desativa o alerta de jogos grátis",
    execute,
};