const Discord = require('discord.js');
const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {
    return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..");
  }

  queue.dispatcher.pause();

  //build embed
  const message = new Discord.MessageEmbed()
    .setColor('#ffb361')
    .setAuthor("Música em Pause")
    .setDescription("A trilha atual está em pause")
    .setThumbnail("https://i.imgur.com/EEm4UtH.jpg")
  msg.reply(message);
  console.log(`(NEW ACTIVITY): pause song`);
};

module.exports = {
  name: "pause",
  help: "você pausa a música em reprodução",
  execute,
};