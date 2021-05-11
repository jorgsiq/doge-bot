const Discord = require('discord.js');
const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {
    
    msg.delete();

    return msg.reply(`opa! parece que não existe nenhuma música sendo reproduzida..`).then(msg => {
      setTimeout(() => msg.delete(), 10000)
    });

  }

  queue.dispatcher.pause();

  //build embed
  const message = new Discord.MessageEmbed()
    .setColor('#EFE3CA')
    .setAuthor("Música em Pause")
    .setDescription("A trilha atual está em pause")
    .setThumbnail("https://i.imgur.com/tKDUKm9.png")
  console.log(`(NEW ACTIVITY): pause song`);

  setTimeout(function () {
    msg.delete();
  }, 300000);
  return msg.reply(message).then(msg => {
    setTimeout(() => msg.delete(), 300000)
  });
};

module.exports = {
  name: "pause",
  help: "você pausa a música em reprodução",
  execute,
};