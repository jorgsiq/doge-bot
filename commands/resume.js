const Discord = require('discord.js');
const values = require('./../values');
const playSong = require("./play").playSong;
const stop = require("./stop").execute;
const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {

    msg.delete().catch((error) => {
      console.error('Failed task with the following error:', error); 
    });

    return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..").then(msg => {
      setTimeout(() => msg.delete(), 10000)
    }).catch((error) => {
      console.error('Failed task with the following error:', error); 
    });

  }
  
  try{
    //queue.dispatcher.resume(true)
    playSong(bot, msg, queue.songs[0]);
  }
  catch(err){
    stop(bot, msg);
  }

  //build embed
  const message = new Discord.RichEmbed()
    .setColor(values.colorDoge)
    //.setColor(values.colorDoge)
    .setAuthor("Reproduzindo Música")
    .setDescription("Devido a uma incompatibilidade do **Streaming Dispatcher** com as versão mais novas do Node, o comando **?resume** está temporariamente impossibilitado de retornar a faixa atual no mesmo instante em que foi interrompido com o comando **?pause**. Pedimos desculpas pelo incoveniente!")
    //.setDescription("A trilha atual foi reiniciada")
    .setThumbnail(values.resumeImageUrl)


  setTimeout(function () {
    msg.delete().catch((error) => {
      console.error('Failed task with the following error:', error); 
    });
  }, 300000);
  return msg.reply(message).then(msg => {
    setTimeout(() => msg.delete(), 300000)
  }).catch((error) => {
    console.error('Failed task with the following error:', error); 
  });

};

module.exports = {
  name: "resume",
  help: "\n (Music Player) você retoma a reprodução da música atual",
  execute,
};