const Discord = require('discord.js');
const { DiscordAPIError } = require("discord.js");
const values = require('./../values');

const execute = (bot, msg, args) => {
    const message = new Discord.MessageEmbed()
        .setColor(values.colorDoge)
        .setTitle(`Đoge Bot`)
        .setDescription(`Eu sou um bot projetado especialmente para atender ao servidor **Đoge Style**\n\nSe você deseja conhecer ou colaborar com meu código fonte, ele está disponível neste repositório no [Github](https://github.com/jorgsiq/dogge-bot)\n\nUtilize "**?help**" e descubra o que posso fazer!\n\nㅤ ㅤ`)
        .setFooter(`ㅤ ㅤ\n\nPrecisa de ajuda? Contate: support@jorgesiqueira.com`)
        .setImage(values.versionImageUrl)
        .addFields(
            { name: 'Versão Atual', value: `64#522b6a7`, inline: true },
            { name: 'Último Update', value: '2023-07-09 18:02:58 UTC', inline: true },
            { name: 'Status', value: 'Online', inline: true },
            { name: 'ytdl-core', value: 'Not Working', inline: true },
            { name: 'Autor', value: '@jorgsiq', inline: true },
        )
    msg.author.send(message);

    setTimeout(function () {
        msg.delete();
    }, 300000);
    return msg.reply(`Estou te enviando uma mensagem privada com mais informações!`).then(msg => {
        setTimeout(() => msg.delete(), 300000)
    }).catch((error) => {
        console.error('Failed task with the following error:', error);
    });
};

module.exports = {
    name: "about",
    help: `\n (Info) você vê informações técnicas do bot`,
    execute,
};