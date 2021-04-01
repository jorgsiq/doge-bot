const Discord = require('discord.js');
const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {
    return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..");
  }

  const volume = Number(args.join(" "));
  //invalid arguments for volume command
  if (isNaN(volume) || volume < 0 || volume > 10) {
    return msg.reply("o volume deve ser um valor entre 0 e 10, tente novamente!");
  }

  //build embed
  const message = new Discord.MessageEmbed()
    .setColor('#ffb361')
    .setAuthor("Volume Ajustado")
    .setDescription(`Volume atual em (**${volume}**/10)`)
    .setThumbnail("https://i.imgur.com/EEm4UtH.jpg")
  msg.reply(message);
  console.log(`(NEW ACTIVITY): change volume`);

  //set volume scale
  queue.dispatcher.setVolume(volume / 10);
  queue.volume = volume;
  bot.queues.set(msg.guild.id, queue);
};

module.exports = {
  name: "volume",
  help: "você ajusta o volume de reprodução (0 a 10)",
  execute,
};