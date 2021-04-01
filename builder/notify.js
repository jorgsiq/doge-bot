const Discord = require("discord.js");

async function messageSubscribers (bot, message) {
    console.log(`(NEW ACTIVITY): new notice sent in channel #news by @${message.author.username}`);
    //if the message has an attachment, it will be collected by messageAttachment, else it gets a null state
    let messageAttachment = message.attachments.size > 0 ? message.attachments.array()[0].url : null;
    const news = new Discord.MessageEmbed()
        .setTitle("Novo Alerta!")
        .setColor('#5dbea6')
        .setDescription(message.content)
        .setTimestamp()
        .setFooter(`Por: @${message.author.tag}`)
    //if the past message had an attachment, it will set in the embed image content
    if (messageAttachment){
        news.setImage(messageAttachment);
    }
    bot.channels.cache.get("750472762367279245").send(news);
    //iterates each member, the member who is a subscriber recieves a direct message with the alert
    const list = bot.guilds.cache.get("457325029433278468");
    let i = 1;
    list.members.cache.each(member => {
        if (member.roles.cache.some(role => role.name === 'Subscriber')) {
            setTimeout(function () {
                member.send(news);
                console.log(`(NEW ACTIVITY): new alert sent to @${member.user.username} as a direct message`);
            }, 5000 * i); //5 seconds for each notification
            i++;
        }
    });
}

module.exports = {messageSubscribers};