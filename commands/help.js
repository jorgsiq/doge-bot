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

    const commandsMessage = new Discord.MessageEmbed()
        .setColor('#ff9900')
        .setTitle(`Olá, @${msg.author.username}!`)
        .setDescription(`Aqui estão os comandos que você pode utilizar dentro do canal **#commands** no servidor da **Đoge Style**.\n\n Para realizar um comando, escreva no seguinte formato: **?[comando]**\n A lista completa de comandos você confere na lista abaixo:\n\n\n ${commandsList}\nSe tiver alguma dúvida, peça ajuda a um **@Staff**`)

    msg.author.send(commandsMessage);

    return msg.reply("estou te enviando uma mensagem privada com todos os comandos!");
};

module.exports = {
    name: "help",
    help: "você recebe a lista de comandos do bot",
    execute,
};