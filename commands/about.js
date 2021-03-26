const Discord = require('discord.js');
const { DiscordAPIError } = require("discord.js");

const execute = (bot, msg, args) => {
    const message = new Discord.MessageEmbed()
        .setColor('#ff9900')
        .setTitle(`Đoge Bot`)
        .setDescription(`Eu sou um bot projetado especialmente para o servidor da **Đoge Style**!\n\n Se você deseja ver meu código fonte, ele está disponível no [Github](https://github.com/jorgsiq/dogge-bot)!\n\nCom o comando "**?help**" você recebe uma lista com todos meus truques\n`)
        .setFooter(`\n\nPrecisa de ajuda? Contate: support@jorgesiqueira.com`)
        .addFields(
            { name: 'Versão Atual', value: `29#d330d84`, inline: true },
            { name: 'Último Update', value: '2021-03-25 22:45:10 UTC', inline: true },
            { name: 'Status', value: 'Online', inline: true },
            { name: 'ytdl-core', value: 'Working', inline: true },
            { name: 'Tecnologia', value: 'Discord.js', inline: true },
            { name: 'Autor', value: 'Jorge Siqueira', inline: true },
            
        )

    msg.author.send(message);
    return msg.reply(`estou te enviando uma mensagem privada com mais informações!`);
};

module.exports = {
    name: "about",
    help: "você vê informações técnicas do bot",
    execute,
};