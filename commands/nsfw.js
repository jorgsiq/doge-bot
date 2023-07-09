const Discord = require('discord.js');
const values = require('./../values');
const execute = (bot, msg, args) => {

    let channel = bot.channels.cache.get(values.nsfwChannelId);
    // command @mention
    if (args[0] === undefined || args[0] === null) {
        if (channel.permissionsFor(msg.member.user).has('VIEW_CHANNEL', true)) {
            msg.delete().catch((error) => {
                console.error('Failed task with the following error:', error);
            });
            return msg.reply("Opa! parece que você já desbloqueou os canais NSFW..").then(msg => {
                setTimeout(() => msg.delete(), 10000)
            }).catch((error) => {
                console.error('Failed task with the following error:', error);
            });
        }
        channel.updateOverwrite(msg.author, {
            VIEW_CHANNEL: true
        })
            .then(channel => (channel.permissionOverwrites.get(msg.author.id)))
            .catch(console.error);

        const message = new Discord.MessageEmbed()
            .setTitle("NSFW 🔥")
            .setColor(values.colorGreen)
            .setAuthor(msg.member.user.tag, msg.member.user.displayAvatarURL())
            .setDescription("Este membro agora faz parte do canal secreto!")
            .setTimestamp()
            .setFooter("Acesso Desbloqueado")

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
                let channel = bot.channels.cache.get(values.nsfwChannelId);

                channel.updateOverwrite(user, {
                    VIEW_CHANNEL: true
                })
                    .then(channel => console.log(channel.permissionOverwrites.get(userId)))
                    .catch(console.error);

                const message = new Discord.MessageEmbed()
                    .setTitle("NSFW 🔥")
                    .setColor(values.colorDoge)
                    .setAuthor(user.tag, user.displayAvatarURL())
                    .setDescription("Este membro agora faz parte do canal secreto!")
                    .setTimestamp()
                    .setFooter("Acesso Desbloqueado")

                console.log(`(NEW ACTIVITY): subscription message sent on the server`);

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
    name: "nsfw",
    help: "+ **menção de usuário** (se não for você) \n (NSFW) desbloqueia os canais nsfw para você ou para alguém",
    execute,
};



