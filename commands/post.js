const Discord = require('discord.js');
const values = require('./../values');
const { DiscordAPIError } = require("discord.js");

const execute = (bot, message, args) => {
    //post nsfw1 texto
    let targetChannel, complement;
    let channel = args[0];
    let name = "@desconhecido";
    if (args[1] !== undefined && args[1] !== null) {
        name = args[1];
    }
    let content = message.content.substr(message.content.indexOf(" ") + 1);
    //if the message has an attachment, it will be collected by messageAttachment, else it gets a null state
    let messageAttachment = message.attachments.size > 0 ? message.attachments.array()[0].url : null;

    switch (channel) {
        case "nsfwgirl":
            complement = "🍑";
            targetChannel = values.nsfw1ChannelId;
            break;
        case "nsfwboy":
            complement = "🍌";
            targetChannel = values.nsfw2ChannelId;
            break;
        case "nsfwgeneral":
            complement = "💦";
            targetChannel = values.nsfw3ChannelId;
            break;
        default:
            targetRole = "Invalid";
            return message.reply("Opa! parece que você esqueceu de inserir o pin correto, tente novamente..");
    }

    const messagepost = new Discord.MessageEmbed()
        .setTitle(name + " " + complement)
        .setTimestamp()
        .setColor(values.colorDoge)
        .setDescription("enviado no modo anônimo")
        .setFooter(`#${channel.toUpperCase()}, +18`)
    //if the past message had an attachment, it will set in the embed image content
    if (messageAttachment) {
        messagepost.setImage(messageAttachment);
        bot.channels.cache.get(`${targetChannel}`).send(messagepost);
        const ms = new Discord.MessageEmbed()
            .setColor(values.colorGreen)
            .setDescription(
                "**SUCESSO!** Publicação anônima efetuada no servidor"
            );
        return (message.reply(ms));
    }
    else {
        return message.reply("opa! parece que você esqueceu de inserir uma mídia, tente novamente..");
    }

};

module.exports = {
    name: "post",
    help: "+ **pin da categoria** \n (NSFW) você faz uma publicação anônima com conteúdo nsfw",
    execute,
};