const Discord = require('discord.js');
const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {
    return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..");
  }
  //resumes the music streaming in channel
  queue.dispatcher.resume();


  const message = new Discord.MessageEmbed()
    .setColor('#ff9900')
    .setAuthor("Reproduzindo Música")
    .setDescription("A trilha atual foi continuada")
    .setImage("https://pm1.narvii.com/7475/3738ce8a9e3ead473a8c2f19b0e5150ca17fcd90r1-500-500v2_hq.jpg")
  msg.reply(message);
};

module.exports = {
  name: "resume",
  help: "você retoma a reprodução da música atual",
  execute,
};