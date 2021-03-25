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
  };
  
  module.exports = {
    name: "stop",
    help: "você interrompe a reprodução de músicas",
    execute,
  };