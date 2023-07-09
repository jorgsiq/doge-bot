const playSong = require("./play").playSong;
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
  //remove the music in first position
  queue.songs.shift();

  //do it globally
  bot.queues.set(msg.guild.id, queue);
  //position 1 is now position 0 then play song
  playSong(bot, msg, queue.songs[0]);

  if (queue.songs.length == 0) {
    setTimeout(function () {
      msg.delete().catch((error) => {
        console.error('Failed task with the following error:', error);
      });
    }, 300000);
    return;
  }
  //build embed
  const message = new Discord.MessageEmbed()
    .setColor(values.colorDoge)
    .setAuthor("Próxima Música")
    .setDescription("Iniciando a próxima música")
    .setThumbnail(values.skipImageUrl)


  setTimeout(function () {
    msg.delete().catch((error) => {
      console.error('Failed task with the following error:', error);
    });
  }, 300000);
  return msg.reply(message).then(msg => {
    setTimeout(() => msg.delete(), 300000)
  }).catch((error) => {
    console.error('Failed task with the following error:', error);
  });
};

module.exports = {
  name: "skip",
  help: "\n (Music Player) você avança a reprodução para a próxima música",
  execute,
};