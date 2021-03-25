const execute = (bot, msg, args) => {
    const queue = bot.queues.get(msg.guild.id);
    if (!queue) {
      return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..");
    }
    //pause active music stream in channel
    queue.dispatcher.pause();
  };
  
  module.exports = {
    name: "pause",
    help: "você pausa a música em reprodução",
    execute,
  };