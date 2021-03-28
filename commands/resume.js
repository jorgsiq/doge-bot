const Discord = require('discord.js');
const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {
    return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..");
  }
  //resumes the music streaming in channel
  queue.dispatcher.resume();

  //build embed
  const message = new Discord.MessageEmbed()
    .setColor('#ffb361')
    .setAuthor("Reproduzindo Música")
    .setDescription("A trilha atual foi continuada")
    .setThumbnail("https://i.imgur.com/EEm4UtH.jpg")
  msg.reply(message);
  console.log(`(NEW ACTIVITY): resume song`);
};

module.exports = {
  name: "resume",
  help: "você retoma a reprodução da música atual",
  execute,
};