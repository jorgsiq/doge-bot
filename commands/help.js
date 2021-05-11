const Discord = require('discord.js');
const { DiscordAPIError } = require("discord.js");

const execute = (bot, msg, args) => {
    let commandsList = "";
    const prefix = "?";
    let x = 1;
    bot.commands.forEach((command) => {
        if (command.help) {
            commandsList += `(${(x++)}) **${prefix}${command.name}** -> ${command.help}\n\n`;
        }
    });

    //build embed
    const commandsMessage = new Discord.MessageEmbed()
        .setColor('#EFE3CA')
        .setTitle(`Olá, @${msg.author.username}!`)
        .setDescription(`Aqui estão os comandos que você pode utilizar dentro do canal **#commands** no servidor da **Đoge Style**.\n\n Para realizar um comando, escreva no seguinte formato: **?[comando]**\n A lista completa de comandos você confere abaixo:\n\n\n ${commandsList}\nSe tiver alguma dúvida, peça ajuda a um **@Staff**`)

    msg.author.send(commandsMessage);
    console.log(`(NEW ACTIVITY): help message sent as a private message`);
    setTimeout(function () {
        msg.delete();
    }, 300000);
    return msg.reply(`estou te enviando uma mensagem privada com todos os comandos!`).then(msg => {
        setTimeout(() => msg.delete(), 300000)
    });
};

module.exports = {
    name: "help",
    help: "você recebe a lista de comandos do bot",
    execute,
};