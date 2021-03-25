const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {
    return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..");
  }
  //reset queue
  queue.songs = [];
  bot.queues.set(msg.guild.id, queue);
  //music stream now is ended
  queue.dispatcher.end();

  const message = new Discord.MessageEmbed()
    .setColor('#ff9900')
    .setAuthor("Reprodução Interrompida")
    .setDescription("Todas as trilhas foram encerradas")
    .setImage("https://pm1.narvii.com/7475/3738ce8a9e3ead473a8c2f19b0e5150ca17fcd90r1-500-500v2_hq.jpg")
  msg.reply(message);
};

module.exports = {
  name: "stop",
  help: "você interrompe a reprodução de músicas",
  execute,
};