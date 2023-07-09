const Discord = require('discord.js');
const values = require('./../values');
const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {

    msg.delete().catch((error) => {
      console.error('Failed task with the following error:', error);
    });

    return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..").then(msg => {
      setTimeout(() => msg.delete(), 10000)
    }).catch((error) => {
      console.error('Failed task with the following error:', error);
    });
  }
  //reset queue
  queue.songs = [];
  bot.queues.set(msg.guild.id, queue);
  //music stream now is ended
  queue.dispatcher.end();

  //build embed


  setTimeout(function () {
    msg.delete().catch((error) => {
      console.error('Failed task with the following error:', error);
    });
  }, 300000);


};

module.exports = {
  name: "stop",
  help: "\n (Music Player) você interrompe a reprodução da playlist",
  execute,
};