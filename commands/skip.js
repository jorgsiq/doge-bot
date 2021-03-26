const playSong = require("./play").playSong;
const Discord = require('discord.js');

const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {
    return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..");
  }
  //remove the music in first position
  queue.songs.shift();
  //do it globally
  bot.queues.set(msg.guild.id, queue);
  //now position 1 (second) is position 0 (first) and we can play this song
  playSong(bot, msg, queue.songs[0]);

  const message = new Discord.MessageEmbed()
            .setColor('#ff9900')
            .setAuthor("Próxima Música")
            .setDescription("Iniciando a próxima música")
            .setImage("https://i.imgur.com/EEm4UtH.jpg")
  msg.reply(message);
};

module.exports = {
  name: "skip",
  help: "você avança a reprodoução para a próxima música",
  execute,
};