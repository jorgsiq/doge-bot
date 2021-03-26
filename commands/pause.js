const Discord = require('discord.js');
const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {
    return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..");
  }
  //pause active music stream in channel
  queue.dispatcher.pause();

  const message = new Discord.MessageEmbed()
    .setColor('#ffb361')
    .setAuthor("Música Interrompida")
    .setDescription("A trilha atual foi interrompida")
    .setImage("https://i.imgur.com/EEm4UtH.jpg")
  msg.reply(message);
};

module.exports = {
  name: "pause",
  help: "você pausa a música em reprodução",
  execute,
};