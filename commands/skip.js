const playSong = require("./play").playSong;

const execute = (bot, msg, args) => {
  const queue = bot.queues.get(msg.guild.id);
  if (!queue) {
    return msg.reply("opa! parece que não existe nenhuma música sendo reproduzida..");
  }
  //remove the music in first position
  queue.songs.shift();
  //do it globally
  bot.queues.set(msg.guild.id, queue);
  //now position 1 (second) is position 0 (first) and we can play this song
  playSong(bot, msg, queue.songs[0]);
};

module.exports = {
  name: "skip",
  help: "avança a repdoução para a próxima música",
  execute,
};