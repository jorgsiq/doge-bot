const Discord = require('discord.js');
const values = require('./../values');
const execute = (bot, msg, args) => {

    let channel = bot.channels.cache.get(values.nsfwChannelId);
    // command @mention
    if (args[0] === undefined || args[0] === null) {
        if (channel.permissionsFor(msg.member.user).has('VIEW_CHANNEL', false)) {
            msg.delete().catch((error) => {
                console.error('Failed task with the following error:', error);
            });
            return msg.reply("Opa! parece que você já saiu dos canais NSFW..").then(msg => {
                setTimeout(() => msg.delete(), 10000)
            }).catch((error) => {
                console.error('Failed task with the following error:', error);
            });
        }
        channel.updateOverwrite(msg.author, {
            VIEW_CHANNEL: false
        })
            .then(channel => (channel.permissionOverwrites.get(msg.author.id)))
            .catch(console.error);

        const message = new Discord.MessageEmbed()
            .setTitle("NSFW 🔥")
            .setColor(values.colorGrey)
            .setAuthor(msg.member.user.tag, msg.member.user.displayAvatarURL())
            .setDescription("Este membro não faz mais parte do canal secreto!")
            .setTimestamp()
            .setFooter("Acesso Bloqueado")

        setTimeout(function () {
            msg.delete().catch((error) => {
                console.error('Failed task with the following error:', error);
            });
        }, 10000);
        return msg.reply(message).then(msg => {
            setTimeout(() => msg.delete(), 10000)
        }).catch((error) => {
            console.error('Failed task with the following error:', error);
        });
    } else {

        if (msg.member.roles.cache.some(role => role.name === 'Staff')) {
            {

                let userId = args[0].replace(/[\\<>@#&!]/g, "");
                let user = bot.users.cache.find(user => user.id === userId);


                channel.updateOverwrite(user, {
                    VIEW_CHANNEL: false
                })
                    .then(channel => (channel.permissionOverwrites.get(userId)))
                    .catch(console.error);

                const message = new Discord.MessageEmbed()
                    .setTitle("NSFW 🔥")
                    .setColor(values.colorGrey)
                    .setAuthor(user.tag, user.displayAvatarURL())
                    .setDescription("Este membro não faz mais parte do canal secreto!")
                    .setTimestamp()
                    .setFooter("Acesso Bloqueado")

                console.log(`(NEW ACTIVITY): subscription message sent on the server`);

                msetTimeout(function () {
                    msg.delete().catch((error) => {
                        console.error('Failed task with the following error:', error);
                    });
                }, 10000);
                return msg.reply(message).then(msg => {
                    setTimeout(() => msg.delete(), 10000)
                }).catch((error) => {
                    console.error('Failed task with the following error:', error);
                });
            }
        }
        else {
            msg.delete().catch((error) => {
                console.error('Failed task with the following error:', error);
            });
            return msg.reply("Opa! parece que você não tem permissão para utilizar esse comando..").then(msg => {
                setTimeout(() => msg.delete(), 10000)
            }).catch((error) => {
                console.error('Failed task with the following error:', error);
            });
        }
    }
};

module.exports = {
    name: "quit-nsfw",
    help: "+ **menção de usuário** (se não for você) \n (NSFW) bloqueia os canais nsfw para si ou para alguém",
    execute,
};



