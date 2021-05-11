const Discord = require('discord.js');
const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {

    msg.delete();

    return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..").then(msg => {
      setTimeout(() => msg.delete(), 10000)
    });
  }
  //reset queue
  queue.songs = [];
  bot.queues.set(msg.guild.id, queue);
  //music stream now is ended
  queue.dispatcher.end();

  //build embed
  
  console.log(`(NEW ACTIVITY): stop playing`);
  setTimeout(function () {
    msg.delete();
  }, 300000);
  

};

module.exports = {
  name: "stop",
  help: "você interrompe a reprodução de músicas",
  execute,
};