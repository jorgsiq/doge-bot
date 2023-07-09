const Discord = require("discord.js");
const values = require('./../values');
const stop = require("./stop").execute;
const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {
    msg.delete().catch((error) => {
      console.error('Failed task with the following error:', error);
    });

    return msg
      .reply(`Opa! parece que não existe nenhuma música sendo reproduzida..`)
      .then((msg) => {
        setTimeout(() => msg.delete(), 10000);
      }).catch((error) => {
        console.error('Failed task with the following error:', error);
      });
  }
  try {
    queue.dispatcher.pause(true);

    //build embed
    const message = new Discord.MessageEmbed()
      .setColor(values.colorDoge)
      .setAuthor("Música em Pause")
      .setDescription("A trilha atual está em pause")
      .setThumbnail(values.pauseImageUrl);

    setTimeout(function () {
      msg.delete().catch((error) => {
        console.error('Failed task with the following error:', error);
      });
    }, 300000);
    return msg.reply(message).then((msg) => {
      setTimeout(() => msg.delete(), 300000);
    }).catch((error) => {
      console.error('Failed task with the following error:', error);
    });
  } catch (err) {
    stop(bot, msg);
  }
};

module.exports = {
  name: "pause",
  help: "\n (Music Player) você pausa a música em reprodução",
  execute,
};
