const playSong = require("./play").playSong;
const Discord = require('discord.js');

const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {

    msg.delete();

    return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..").then(msg => {
      setTimeout(() => msg.delete(), 10000)
    });

  }
  //remove the music in first position
  queue.songs.shift();

  //do it globally
  bot.queues.set(msg.guild.id, queue);
  //position 1 is now position 0 then play song
  playSong(bot, msg, queue.songs[0]);

  if (queue.songs.length == 0){
    setTimeout(function () {
      msg.delete();
    }, 300000);
    return;
  }
  //build embed
  const message = new Discord.MessageEmbed()
    .setColor('#EFE3CA')
    .setAuthor("Próxima Música")
    .setDescription("Iniciando a próxima música")
    .setThumbnail("https://i.imgur.com/tKDUKm9.png")
  console.log(`(NEW ACTIVITY): skip song`);

  setTimeout(function () {
    msg.delete();
  }, 300000);
  return msg.reply(message).then(msg => {
    setTimeout(() => msg.delete(), 300000)
  });
};

module.exports = {
  name: "skip",
  help: "você avança a reprodução para a próxima música",
  execute,
};