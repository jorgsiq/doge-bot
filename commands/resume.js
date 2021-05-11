const Discord = require('discord.js');
const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {

    msg.delete();

    return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..").then(msg => {
      setTimeout(() => msg.delete(), 10000)
    });

  }
  //resumes the music streaming in channel
  queue.dispatcher.resume();

  //build embed
  const message = new Discord.MessageEmbed()
    .setColor('#EFE3CA')
    .setAuthor("Reproduzindo Música")
    .setDescription("A trilha atual foi continuada")
    .setThumbnail("https://i.imgur.com/em4ISnY.png")

  console.log(`(NEW ACTIVITY): resume song`);

  setTimeout(function () {
    msg.delete();
  }, 300000);
  return msg.reply(message).then(msg => {
    setTimeout(() => msg.delete(), 300000)
  });

};

module.exports = {
  name: "resume",
  help: "você retoma a reprodução da música atual",
  execute,
};