const Discord = require("discord.js");
const values = require('./../values');

async function messageSubscribers(bot, message) {
    //if the message has an attachment, it will be collected by messageAttachment, else it gets a null state
    let messageAttachment = message.attachments.size > 0 ? message.attachments.array()[0].url : null;
    const news = new Discord.MessageEmbed()
        .setTitle("Novo Alerta!")
        .setColor(values.colorGreen)
        .setDescription(message.content)
        .setTimestamp()
        .setFooter(`Por: @Đoge Bot#1161`)
    //if the past message had an attachment, it will set in the embed image content
    if (messageAttachment) {
        news.setImage(messageAttachment);
    }

    bot.channels.cache.get(values.alertsChannelId).send("@everyone").then(msg => {
        setTimeout(() => msg.delete(), 1800000)
    }).catch((error) => {
        console.error('Failed task with the following error:', error);
    });
    bot.channels.cache.get(values.alertsChannelId).send(news);

    message.reply("Encaminhei a mensagem incorporada para o destino e agora estou notificando os assinantes!");
    //iterates each member, the member who is a subscriber recieves a direct message with the alert
    const list = bot.guilds.cache.get(values.membersId);
    let i = 1;
    list.members.cache.each(member => {
        if (member.roles.cache.some(role => role.name === 'Subscriber')) {
            setTimeout(function () {
                member.send(news);
            }, 60000 * i); //60 seconds for each notification
            i++;
        }
    });
}

module.exports = { messageSubscribers };
