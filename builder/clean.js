const Discord = require("discord.js");
const values = require('./../values');

async function cleanBulk(bot) {
    let now = new Date();
    let hour = now.getHours();
    let minute = now.getMinutes();
    let hours = 0;
    let minutes = 0;

    if (hour == 9 && minute == 0) {
        hours = 0;
        minutes = 0;
    }
    else if (hour < 9) {
        hours = 8 - hour;
        minutes = 60 - minute;
    } else {
        hours = 24 - hour + 8;
        minutes = 60 - minute;
    }

    let time = ((minutes * 1000 * 60) + (hours * 1000 * 60 * 60));
    let day = 1000 * 60 * 60 * 24;

    setInterval(function () {
        time -= 1000;
        if (time == 0) {
            cleanAll().catch(console.error);
            time = day;
        }
    }, (1000));

    const cleanAll = async () => {
        const updateMessage = new Discord.MessageEmbed()
            .setColor(values.colorDoge)
            .setTitle(`Novinho em Folha!`)
            .setImage(values.cleanImageUrl)
            .setDescription(
                `Por segurança e privacidade as mensagens deste canal de texto foram apagadas permanentemente, tenha atenção que esta limpeza acontece diariamente às **06:00 (BRA)** em todos os canais de conversa! (exceto **#chat**)\nㅤ`
            )
            .setFooter(`Limpeza Concluída`)
            .setTimestamp();

        const gamingChannel = bot.channels.cache.get(values.gamingChannelId);
        const privateChannel = bot.channels.cache.get(values.privateChannelId);

        await deleteAllMessages(gamingChannel).catch(console.error);
        await gamingChannel.send(updateMessage).catch(console.error);

        await deleteAllMessages(privateChannel).catch(console.error);
        await privateChannel.send(updateMessage).catch(console.error);
    };

    const deleteAllMessages = async (channel) => {
        let messagesDeleted = 0;
        let messages = await channel.messages.fetch({ limit: 100 });

        while (messages.size > 0) {
            await channel.bulkDelete(messages).catch(console.error);
            messagesDeleted += messages.size;
            messages = await channel.messages.fetch({ limit: 100 });
        }
    };
}

module.exports = { cleanBulk };
