const Discord = require('discord.js');
const { DiscordAPIError } = require("discord.js");

const execute = (bot, msg, args) => {
    let commandsList = "";
    const prefix = "?";
    bot.commands.forEach((command) =>{
        if (command.help){
            commandsList += `**${prefix}${command.name}**: ${command.help}\n`;
        }
    });

    const commandsMessage = new Discord.MessageEmbed()
    .setColor('#ff9900')
    .setTitle(`Olá, @${msg.author.username}!`)
    .setDescription(`Aqui estão os comandos que você pode utilizar dentro do canal **#commands** no servidor da **Đoge Style**.\n\n\nLista de Comando do **Đoge Bot**:\n\n ${commandsList}\n\n  Se tiver alguma dúvida de como usar, converse com um **@Staff**`)

    msg.author.send(commandsMessage);

    return msg.reply("estou te enviando uma mensagem privada com todos os comandos!");
};

module.exports = {
    name: "help",
    help: "você recebe a lista de comandos do bot",
    execute,
};