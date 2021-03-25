const search = require("yt-search");
const ytdl = require("ytdl-core-discord");

const execute = (bot, msg, args) => {
    //build a string with all the args 
    const s = args.join(" ");
    try {
        search(s, (err, result) => {
            if (err) {
                throw err;
            } else if (result && result.videos.length > 0) {
                if (s == null || s.length <=1){
                   return msg.reply(`ei! não esqueça de colocar o nome da música após o comando..`);
                }
                //picks the first result in youtube search
                const song = result.videos[0];
                const queue = bot.queues.get(msg.guild.id);
                //if already exists a queue than enqueue new song
                if (queue) {
                    queue.songs.push(song);
                    bot.queues.set(msg.guild.id, queue);

                }
                //if there are not any queue than just play the requested music
                else {
                    playSong(bot, msg, song);
                }
            } else {
                return msg.reply(`desculpe! não consegui encontrar a música que você pediu..`);
            }
        });
    } catch (e) {
        console.error(e);
    }
};
//handle with voice channel, user and music queue
const playSong = async (bot, msg, song) => {
    let queue = bot.queues.get(msg.member.guild.id);
    if (!song) {
        if (queue) {
            queue.connection.disconnect();
            return bot.queues.delete(msg.member.guild.id);
        }
    }
    if (!msg.member.voice.channel) {
        return msg.reply(`**${song.title}**?! bom gosto! mas você precisa estar em um canal de voz para poder reproduzir essa música..`);
    }
    //create a new queue if it does not exists
    if (!queue) {
        const conn = await msg.member.voice.channel.join();
        queue = {
            volume: 10,
            connection: conn,
            dispatcher: null,
            songs: [song],
        };
    }
    //highWaterMark is part of a correction with larger buffer to avoid cuts in audio stream
    queue.dispatcher = await queue.connection.play(
        await ytdl(song.url, { highWaterMark: 1 << 25, filter: "audioonly" }),
        {
            type: "opus",
        }
    );
    //current song finish
    queue.dispatcher.on("finish", () => {
        queue.songs.shift();
        //call for next song in queue
        playSong(bot, msg, queue.songs[0]);
    });
    bot.queues.set(msg.member.guild.id, queue);
};

module.exports = {
    name: "play",
    help: "você reproduz a música informada",
    execute,
    playSong,
};