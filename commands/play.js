const search = require("yt-search");
const ytdl = require("ytdl-core-discord");
const Discord = require('discord.js');
const values = require('./../values');

const execute = (bot, msg, args) => {
    //build a string with all the args 

    const s = args.join(" ");
    try {
        search(s, (err, result) => {
            if (err) {
                throw err;
            } else if (result && result.videos.length > 0) {
                //picks the first result in youtube search
                const song = result.videos[0];

                //TEMPORARY HANDLING WITH STREAM ISSUE BY DISCORD SIDE----------------------------
                setTimeout(function () {
                    msg.delete().catch((error) => {
                        console.error('Failed task with the following error:', error);
                    });
                }, 10000);
                msg.reply(notifyUser(song, "unavailable")).then(msg => {
                    setTimeout(() => msg.delete(), 10000)
                }).catch((error) => {
                    console.error('Failed task with the following error:', error);
                });
                return msg.reply(`Desculpe! Esse serviço está atualmente indisponível devido as novas regras impostas pelo Discord..`).then(msg => {
                    setTimeout(() => msg.delete(), 10000)
                }).catch((error) => {
                    console.error('Failed task with the following error:', error);
                });
                //END OF TEMPORARY HANDLER-------------------------------------------------------

                const queue = bot.queues.get(msg.guild.id);

                //if already exists a queue than enqueue new song
                if (queue) {
                    setTimeout(function () {
                        msg.delete().catch((error) => {
                            console.error('Failed task with the following error:', error);
                        });
                    }, 300000);
                    msg.reply(notifyUser(song, "enqeued")).then(msg => {
                        setTimeout(() => msg.delete(), 300000)
                    }).catch((error) => {
                        console.error('Failed task with the following error:', error);
                    });

                    queue.songs.push(song);
                    bot.queues.set(msg.guild.id, queue);

                }
                //if there are not any queue than just play the requested music
                else {
                    playSong(bot, msg, song);
                }
            } else {

                msg.delete().catch((error) => {
                    console.error('Failed task with the following error:', error);
                });

                return msg.reply(`Desculpe! não consegui encontrar a música que você pediu..`).then(msg => {
                    setTimeout(() => msg.delete(), 10000)
                }).catch((error) => {
                    console.error('Failed task with the following error:', error);
                });
            }
        });
    } catch (e) {

        msg.delete().catch((error) => {
            console.error('Failed task with the following error:', error);
        });

        msg.reply(`Ei! não esqueça de colocar o nome da música após o comando..`).then(msg => {
            setTimeout(() => msg.delete(), 10000)
        }).catch((error) => {
            console.error('Failed task with the following error:', error);
        });
        console.error(e);
    }
};
//handle with voice channel, user and music queue
const playSong = async (bot, msg, song) => {
    let queue = bot.queues.get(msg.member.guild.id);
    if (!song) {
        if (queue) {
            const end = new Discord.MessageEmbed()
                .setColor(values.colorDoge)
                .setAuthor("Fim da Reprodução")
                .setDescription("Reprodução foi interrompida")
                .setThumbnail(values.stopImageUrl)

            msg.reply(end).then(msg => {
                setTimeout(() => msg.delete(), 300000)
            }).catch((error) => {
                console.error('Failed task with the following error:', error);
            });
            //end of reproduction
            queue.connection.disconnect();
            return bot.queues.delete(msg.member.guild.id);


        }
    }
    if (!msg.member.voice.channel) {
        msg.delete().catch((error) => {
            console.error('Failed task with the following error:', error);
        });
        return msg.reply(`**${song.title}**?! bom gosto! mas você precisa estar em um canal de voz para poder reproduzir essa música..`).then(msg => {
            setTimeout(() => msg.delete(), 10000)
        }).catch((error) => {
            console.error('Failed task with the following error:', error);
        });

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

    try {
        // play song
        // highWaterMark is part of a correction with larger buffer to avoid cuts in audio stream
        queue.dispatcher = await queue.connection.play(
            await ytdl(song.url, { highWaterMark: 1 << 25, filter: "audioonly" }),
            {
                type: "opus",
            }
        );

        // ...
    } catch (error) {
        console.error('Failed task with the following error:', error);
        msg.reply('Ocorreu um erro ao reproduzir a música. Por favor, tente novamente mais tarde.').catch((error) => {
            console.error('Failed task with the following error:', error);
        });

        // Disconnect the bot from the voice channel
        if (queue && queue.connection) {
            queue.connection.disconnect();
            bot.queues.delete(msg.member.guild.id);
        }
    }


    setTimeout(function () {
        msg.delete().catch((error) => {
            console.error('Failed task with the following error:', error);
        });
    }, 300000);
    msg.reply(notifyUser(song, "playing")).then(msg => {
        setTimeout(() => msg.delete(), 300000)
    }).catch((error) => {
        console.error('Failed task with the following error:', error);
    });

    //current song finish
    queue.dispatcher.on("finish", () => {
        queue.songs.shift();
        //call for next song in queue
        playSong(bot, msg, queue.songs[0]);
    });
    bot.queues.set(msg.member.guild.id, queue);
    queue.dispatcher.setVolumeLogarithmic(queue.volume / 10);
};

const notifyUser = (song, type) => {
    if (type == "playing") {
        const message = new Discord.MessageEmbed()
            .setColor(values.colorDoge)
            .setAuthor("Tocando Agora")
            .setImage(getThumbnail(song.url))
            .setTitle(`\n ${song.title}`)
            .addFields({ name: `Artista`, value: `${song.author.name}` }, { name: `Tempo de Reprodução`, value: `${song.duration.timestamp}` })
            .setFooter(`this record was published ${song.ago}`)
        return message;
    }
    else if (type == "unavailable"){
        const message = new Discord.MessageEmbed()
        .setColor(values.colorDoge)
        .setAuthor("Streaming Indisponível")
        .setImage(getThumbnail(song.url))
        .setTitle(`\n ${song.title}`)
        .addFields({ name: `Artista`, value: `${song.author.name}` }, { name: `Tempo de Reprodução`, value: `${song.duration.timestamp}` }, {name: "YouTube", value: song.url})
        .setFooter(`this record was published ${song.ago}`)
    return message;
    }
    else {
        const message = new Discord.MessageEmbed()
            .setColor(values.colorDoge)
            .setAuthor("Adicionado à Fila")
            .setThumbnail(getThumbnail(song.url))
            .setTitle(`\n ${song.title}`)
            .addFields({ name: `Artista`, value: `${song.author.name}` }, { name: `Tempo de Reprodução`, value: `${song.duration.timestamp}` })
        return message;
    }
};

const getThumbnail = (url) => {
    const quality = "max";
    if (url) {
        var video_id, thumbnail, result;
        if (result = url.match(/youtube\.com.*(\?v=|\/embed\/)(.{11})/)) {
            video_id = result.pop();
        }
        else if (result = url.match(/youtu.be\/(.{11})/)) {
            video_id = result.pop();
        }

        if (video_id) {
            if (typeof quality == "undefined") {
                quality = 'high';
            }

            var quality_key = 'maxresdefault'; // Max quality
            if (quality == 'low') {
                quality_key = 'sddefault';
            } else if (quality == 'medium') {
                quality_key = 'mqdefault';
            } else if (quality == 'high') {
                quality_key = 'hqdefault';
            }

            var thumbnail = "http://img.youtube.com/vi/" + video_id + "/" + quality_key + ".jpg";
            return thumbnail;
        }
    }
    return false;
}

module.exports = {
    name: "play",
    help: "+ **título da música** \n (Music Player) você reproduz a música informada",
    execute,
    playSong,
};