const Discord = require('discord.js');
const values = require('./../values');
const execute = (bot, msg, args) => {
    const queue = bot.queues.get(msg.guild.id);
    if (!queue) {
        msg.delete().catch((error) => {
            console.error('Failed task with the following error:', error); 
          });

        return msg.reply("Opa! parece que não existe nenhuma música sendo reproduzida..").then(msg => {
            setTimeout(() => msg.delete(), 10000)
        }).catch((error) => {
            console.error('Failed task with the following error:', error); 
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

    const queueMessage = new Discord.MessageEmbed()
        .setColor(values.colorDoge)
        .setTitle(`Lista de Reprodução`)
        .setThumbnail(values.queueImageUrl)
        .setDescription(`Para avançar para a próxima música utilize o comando **"?skip"**.\n\nEstas são as faixas que estão na fila atual:\n\n ${playList}`)

    
    setTimeout(function () {
        msg.delete().catch((error) => {
            console.error('Failed task with the following error:', error); 
          });
    }, 300000);
    return msg.reply(queueMessage).then(msg => {
        setTimeout(() => msg.delete(), 300000)
    }).catch((error) => {
        console.error('Failed task with the following error:', error); 
      });

};

module.exports = {
    name: "queue",
    help: "\n (Music Player) você vê a lista de músicas em espera",
    execute,
};