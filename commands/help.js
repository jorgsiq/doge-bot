const Discord = require('discord.js');
const { DiscordAPIError } = require("discord.js");
const values = require('./../values');

const execute = (bot, msg, args) => {
    let commandsList = "";
    const prefix = "?";
    let x = 1;
    bot.commands.forEach((command) => {
        if (command.help) {
            commandsList += `(${(x++)}) **${prefix}${command.name}** ${command.help}\n\n`;
        }
    });
    
    const commandsMessage = new Discord.MessageEmbed()
        .setColor(values.colorDoge)
        .setTitle(`Olá, @${msg.author.username}!`)
        .setDescription(`Aqui estão os comandos que você pode utilizar dentro do canal **#commands** no servidor da **Đoge Style**.\n\n Para realizar um comando, escreva no seguinte formato: **?[comando]**\n A lista completa de comandos você confere abaixo:\n\n\n ${commandsList}\nSe tiver alguma dúvida, peça ajuda a um **@Staff**`)

    msg.author.send(commandsMessage);

    setTimeout(function () {
        msg.delete().catch((error) => {
            console.error('Failed task with the following error:', error);
        });
    }, 300000);
    return msg.reply(`estou te enviando uma mensagem privada com todos os comandos!`).then(msg => {
        setTimeout(() => msg.delete(), 300000)
    }).catch((error) => {
        console.error('Failed task with the following error:', error);
    });
};

module.exports = {
    name: "help",
    help: "\n (Info) você recebe a lista de comandos do bot",
    execute,
};