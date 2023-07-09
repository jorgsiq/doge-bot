const Discord = require('discord.js');
const values = require('./../values');

const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {

    msg.delete().catch((error) => {
      console.error('Failed task with the following error:', error);
    });

    return msg.reply("Opa! parece que não existe nenhuma música sendo reproduzida..").then(msg => {
      setTimeout(() => msg.delete(), 10000)
    }).catch((error) => {
      console.error('Failed task with the following error:', error);
    });

  }

  const volume = Number(args.join(" "));
  //invalid arguments for volume command
  if (isNaN(volume) || volume < 0 || volume > 10) {
    msg.delete().catch((error) => {
      console.error('Failed task with the following error:', error);
    });
    return msg.reply("O volume deve ser um valor entre 0 e 10, tente novamente!").then(msg => {
      setTimeout(() => msg.delete(), 10000)
    }).catch((error) => {
      console.error('Failed task with the following error:', error);
    });
  }

  //build embed
  const message = new Discord.MessageEmbed()
    .setColor(values.colorDoge)
    .setAuthor("Volume Ajustado")
    .setDescription(`Volume atual em (**${volume}**/10)`)
    .setThumbnail(values.volumeImageUrl)


  setTimeout(function () {
    msg.delete().catch((error) => {
      console.error('Failed task with the following error:', error);
    });
  }, 300000);
  msg.reply(message).then(msg => {
    setTimeout(() => msg.delete(), 300000)
  }).catch((error) => {
    console.error('Failed task with the following error:', error);
  });

  //set volume scale
  queue.dispatcher.setVolume(volume / 10);
  queue.volume = volume;
  bot.queues.set(msg.guild.id, queue);

  return volume;
};

module.exports = {
  name: "volume",
  help: "+ **nível** (0 a 10) \n (Music Player) você ajusta o volume de reprodução",
  execute,
};