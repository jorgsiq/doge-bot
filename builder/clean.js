
const Discord = require("discord.js");

async function cleanBulk(bot) {
    let now = new Date();
    let hour = now.getHours();
    let minute = now.getMinutes();
    let hours = 0;
    let minutes = 0;

    //calculate hours and minutes by startup to the pretended time
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
    //value of a day in ms
    const day = 1000 * 60 * 60 * 24;

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
        //build the embed inside the method cleanAll to set timeStamp with right time
        const updateMessage = new Discord.MessageEmbed()
            .setColor('#ffb361')
            .setTitle(`Novinho em Folha!`)
            .setImage("https://i.imgur.com/eK0xXVW.gif")
            .setDescription(`Por segurança e privacidade as mensagens deste canal de texto foram apagadas permanentemente, tenha atenção que esta limpeza acontece diariamente às **10:00 (UTC+1)** em todos os canais de conversa!\nㅤ`)
            .setFooter(`Limpeza Concluída`)
            .setTimestamp()

        const message = new Discord.MessageEmbed()
            .setColor('#ffb361')
            .setTitle(`Đoge Bot`)
            .setDescription(`Eu sou um bot projetado especialmente para atender ao servidor **Đoge Style**\n\nSe você deseja conhecer ou colaborar com meu código fonte, ele está disponível neste repositório no [Github](https://github.com/jorgsiq/dogge-bot)\n\nUtilize "**?help**" e descubra o que posso fazer!\n\nㅤ ㅤ`)
            .setFooter(`ㅤ ㅤ\n\nPrecisa de ajuda? Contate: support@jorgesiqueira.com`)
            .setImage("https://i.imgur.com/qzdBgGD.png")
            .addFields(
                { name: 'Versão Atual', value: `47#73499fd`, inline: true },
                { name: 'Último Update', value: '2021-04-01 15:14:31 UTC', inline: true },
                { name: 'Status', value: 'Online', inline: true },
                { name: 'ytdl-core', value: 'Working', inline: true },
                { name: 'Tecnologia', value: 'Discord.js', inline: true },
                { name: 'Autor', value: 'Jorge Siqueira', inline: true },
            )

        bot.channels.cache.get("826938177267826710").bulkDelete(100)
            .catch(console.error);
        bot.channels.cache.get("826938177267826710").send(updateMessage);

        bot.channels.cache.get("826947909815500850").bulkDelete(100)
            .catch(console.error);
        bot.channels.cache.get("826947909815500850").send(updateMessage);

        bot.channels.cache.get("826077527041638400").bulkDelete(100)
            .catch(console.error);
        bot.channels.cache.get("826077527041638400").send(message);
    };



};

module.exports = { cleanBulk };