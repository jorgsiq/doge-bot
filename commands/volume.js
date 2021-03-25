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


  const message = new Discord.MessageEmbed()
    .setColor('#ff9900')
    .setAuthor("Volume Ajustado")
    .setDescription(`Você alterou o volume para (${volume}/10)`)
    .setImage("https://pm1.narvii.com/7475/3738ce8a9e3ead473a8c2f19b0e5150ca17fcd90r1-500-500v2_hq.jpg")
  msg.reply(message);

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