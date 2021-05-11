const Discord = require('discord.js');
const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {

    msg.delete();

    return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..").then(msg => {
      setTimeout(() => msg.delete(), 10000)
    });

  }

  const volume = Number(args.join(" "));
  //invalid arguments for volume command
  if (isNaN(volume) || volume < 0 || volume > 10) {
    msg.delete();
    return msg.reply("o volume deve ser um valor entre 0 e 10, tente novamente!").then(msg => {
      setTimeout(() => msg.delete(), 10000)
    });
  }

  //build embed
  const message = new Discord.MessageEmbed()
    .setColor('#EFE3CA')
    .setAuthor("Volume Ajustado")
    .setDescription(`Volume atual em (**${volume}**/10)`)
    .setThumbnail("https://i.imgur.com/fOSVbI2.png")
  console.log(`(NEW ACTIVITY): change volume`);

  setTimeout(function () {
    msg.delete();
  }, 300000);
  msg.reply(message).then(msg => {
    setTimeout(() => msg.delete(), 300000)
  });

  //set volume scale
  queue.dispatcher.setVolume(volume / 10);
  queue.volume = volume;
  bot.queues.set(msg.guild.id, queue);

  return volume;
};

module.exports = {
  name: "volume",
  help: "você ajusta o volume de reprodução (0 a 10)",
  execute,
};