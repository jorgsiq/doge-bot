const Discord = require('discord.js');
const execute = (bot, msg, args) => {
    const queue = bot.queues.get(msg.guild.id);
    if (!queue) {

        msg.delete();

        return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..").then(msg => {
            setTimeout(() => msg.delete(), 10000)
        });

    }

    let playList = "";
    let x = 0;
    queue.songs.forEach((song) => {
        if (x == 0) {
            x++;
            playList += `(Reproduzindo) **${song.title}**, ${song.author.name}\n\n`;
        }
        else {
            playList += `(${(x++)}) **${song.title}**, ${song.author.name}\n\n`;
        }

    });

    //build embed
    const queueMessage = new Discord.MessageEmbed()
        .setColor('#EFE3CA')
        .setTitle(`Lista de Reprodução`)
        .setThumbnail("https://i.imgur.com/em4ISnY.png")
        .setDescription(`Para avançar para a próxima música utilize o comando **"?skip"**.\n\nEstas são as faixas que estão na fila atual:\n\n ${playList}`)

    console.log(`(NEW ACTIVITY): queue message sent`);
    setTimeout(function () {
        msg.delete();
    }, 300000);
    return msg.reply(queueMessage).then(msg => {
        setTimeout(() => msg.delete(), 300000)
    });

};

module.exports = {
    name: "queue",
    help: "você vê a lista de músicas em espera",
    execute,
};