
const Discord = require("discord.js");

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
            console.log("(NEW ACTIVITY): cleaning channels!");
            console.log(`next clean: 24h e 00min`);
            cleanAll();

            time = day;
        }
    }, (1000));

    const cleanAll = () => {
        const updateMessage = new Discord.MessageEmbed()
            .setColor('#EFE3CA')
            .setTitle(`Novinho em Folha!`)
            .setImage("https://i.imgur.com/ht266w1.gif")
            .setDescription(`Por segurança e privacidade as mensagens deste canal de texto foram apagadas permanentemente, tenha atenção que esta limpeza acontece diariamente às **06:00 (BRA)** em todos os canais de conversa!\nㅤ`)
            .setFooter(`Limpeza Concluída`)
            .setTimestamp()

        bot.channels.cache.get("826938177267826710").bulkDelete(100).catch(console.error);
        bot.channels.cache.get("826938177267826710").send(updateMessage);

        bot.channels.cache.get("826947909815500850").bulkDelete(100).catch(console.error);
        bot.channels.cache.get("826947909815500850").send(updateMessage);

        bot.channels.cache.get("826168827103674398").bulkDelete(100).catch(console.error);
        bot.channels.cache.get("826168827103674398").send(updateMessage);

    };



};

module.exports = { cleanBulk };