const Discord = require('discord.js');
const values = require('./../values');
const execute = (bot, msg, args) => {

    let name;
    let targetRole = "Invalid";

    try {
        let roleId = args[0].replace(/[\\<>@#&!]/g, "");
        targetRole = roleId;
        switch (roleId) {
            case values.animeClubId:
                name = "Anime Club 🐲"
                break;
            case values.artClubId:
                name = "Art Club 🎨"
                break;
            case values.cinemaClubId:
                name = "Cinema Club 🎥"
                break;
            case values.lgbtClubId:
                name = "LGBT 🌈"
                break;
            case values.readingClubId:
                name = "Reading Club 📚"
                break;
            case values.veggieClubId:
                name = "Veggie 🌱"
                break;
            default:
                targetRole = "Invalid";
        }

        if (msg.member.roles.cache.some(role => role.id === targetRole)) {
            if (targetRole != "Invalid") {
                let role = msg.member.guild.roles.cache.find(role => role.id === targetRole);
                msg.member.roles.remove(role);

                const message = new Discord.MessageEmbed()
                    .setTitle(`${name}`)
                    .setColor(values.colorGrey)
                    .setAuthor(msg.member.user.tag, msg.member.user.displayAvatarURL())
                    .setDescription("Você agora não faz mais parte desta comunidade!")
                    .setTimestamp()
                    .setFooter("Acesso Bloqueado")

                const update = new Discord.MessageEmbed()
                    .setTitle(`${name}`)
                    .setColor(values.colorGrey)
                    .setAuthor(msg.member.user.tag, msg.member.user.displayAvatarURL())
                    .setDescription("Agora não faz mais parte desta comunidade!")
                    .setFooter(`ID do Usuário: ${msg.author.id}`)

                bot.channels.cache.get(values.updatesChannelId).send(`${msg.member.user}`).then(msg => {
                    setTimeout(() => msg.delete(), 1800000)
                }).catch((error) => {
                    console.error('Failed task with the following error:', error);
                });
                bot.channels.cache.get(values.updatesChannelId).send(update);

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
            }
            else {
                msg.delete().catch((error) => {
                    console.error('Failed task with the following error:', error);
                });

                return msg.reply("Opa! parece que você não faz parte deste clube..").then(msg => {
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

            return msg.reply("Opa! parece que você não faz parte deste clube..").then(msg => {
                setTimeout(() => msg.delete(), 10000)
            }).catch((error) => {
                console.error('Failed task with the following error:', error);
            });
        }

    }
    catch (e) {
        msg.delete().catch((error) => {
            console.error('Failed task with the following error:', error);
        });

        msg.reply(`Ei! não esqueça de mencionar o clube que deseja sair..`).then(msg => {
            setTimeout(() => msg.delete(), 10000)
        }).catch((error) => {
            console.error('Failed task with the following error:', error);
        });
        console.error(e);
    }
};

function capitalizeFirstLetter(string) {
    string = string.toLowerCase();
    string = string.replace(/\s/g, '');
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
    name: "quit",
    help: "+ **menção do clube** \n (Clubs) você sai de um clube",
    execute,
};



