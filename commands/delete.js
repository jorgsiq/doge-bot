const Discord = require('discord.js');
const { DiscordAPIError } = require("discord.js");
const values = require('./../values');

const execute = (bot, msg, args) => {
    if (msg.member.roles.cache.some(role => role.name === 'Staff')) {
        if ((parseInt(args[1])) > 100 || (parseInt(args[1])) < 1) {
            msg.delete().catch((error) => {
                console.error('Failed task with the following error:', error);
              });
            return msg.reply("Opa! ocorreu um erro, tente novamente com **?delete** + **id do canal** + **quantidade de mensagens**, lembrando que o **número de mensagens** deve ser **<= 100**..").then(msg => {
                setTimeout(() => msg.delete(), 10000)
            }).catch((error) => {
                console.error('Failed task with the following error:', error);
            });
        }
        else {
            let amount = parseInt(args[1]);

            try {
                bot.channels.cache.get(args[0]).bulkDelete(amount)
            } catch (err) {
                return msg.reply("Opa! ocorreu um erro, tente novamente com **?delete** + **id do canal** + **quantidade de mensagens**, lembrando que o **número de mensagens** deve ser **<= 100**..").then(msg => {
                    setTimeout(() => msg.delete(), 10000)
                }).catch((error) => {
                    console.error('Failed task with the following error:', error);
                  });
            }
            const updateMessage = new Discord.MessageEmbed()
                .setColor(values.colorDoge)
                .setTitle(`Novinho em Folha!`)
                .setDescription(`Apaguei as ${args[1]} últimas mensagens no canal solicitado`)
                .setFooter(`Limpeza Concluída`)
                .setTimestamp()

            setTimeout(function () {
                msg.delete().catch((error) => {
                    console.error('Failed task with the following error:', error);
                  });
            }, 300000);
            return msg.reply(updateMessage).then(msg => {
                setTimeout(() => msg.delete(), 300000)
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
};

module.exports = {
    name: "delete",
    help: "+ **id do canal** + **quantidade de mensagens** \n (Admin) você deleta mensagens de um canal",
    execute,
};