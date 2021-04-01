const Discord = require('discord.js');
const { DiscordAPIError } = require("discord.js");

const execute = (bot, msg, args) => {

    //build embed
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
    msg.author.send(message);
    console.log(`(NEW ACTIVITY): message with bot info was sent as a direct message`);
    return msg.reply(`estou te enviando uma mensagem privada com mais informações!`);
};

module.exports = {
    name: "about",
    help: "você vê informações técnicas do bot",
    execute,
};