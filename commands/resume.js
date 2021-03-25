const execute = (bot, msg, args) => {
    const queue = bot.queues.get(msg.guild.id);
    if (!queue) {
      return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..");
    }
    //resumes the music streaming in channel
    queue.dispatcher.resume();
  };
  
  module.exports = {
    name: "resume",
    help: "você retoma a reprodução da música atual",
    execute,
  };