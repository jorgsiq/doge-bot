const Discord = require('discord.js');
const { DiscordAPIError } = require("discord.js");

const execute = (bot, msg, args) => {
    const welcomeMessage = new Discord.MessageEmbed()
        .setColor('#ff9900')
        .setTitle(`Fala, @${msg.author.username}!`)
        .setAuthor('nipscon', 'https://cdn.discordapp.com/avatars/408450693524094977/3cd4509e87c1f1a55a6508e91258375c.png?size=512')
        .setDescription('É bom saber que agora você também faz parte da Đoge Style! \n\nAntes de embarcar nessa jornada não esqueça de ler nossas normas de convivência fixadas no canal de texto **#rules** \n\nSe precisar de ajuda ou tiver algum problema é só chamar por um **@staff** em qualquer um dos canais. Espero que se divirta!"')
        .setImage('https://media1.tenor.com/images/1feaefbc236ec7dead9f225024edc24b/tenor.gif')

    msg.author.send(welcomeMessage);
    return msg.reply(`estou te enviando uma mensagem privada de boas-vindas!`);
};

module.exports = {
    name: "welcome",
    help: "você recebe uma mensagem de boas-vindas",
    execute,
};