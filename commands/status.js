const Discord = require('discord.js');
const execute = (bot, msg, args) => {
    /*if member does not have the role "subscribed members" then subscribe*/
    if (msg.member.roles.cache.some(role => role.name === 'Boss')) {
        try {
            let newType = "";
            let newUrl = "";
            let newName = "";
            let substring = "://";
            if (args[1].includes(substring)) {
                newType = args[0].toUpperCase().toString();
                args.shift();
                newUrl = args[0].toString();
                args.shift();
                newName = args.join(" ");
            } else {
                newType = args[0].toUpperCase().toString();
                args.shift();
                newUrl = "https://github.com/jorgsiq/dogge-bot";
                newName = args.join(" ");
            }

            bot.user.setPresence({
                status: "available",
                //bot activity set as "Watching: Đoge Style"
                //also can be used with states like: STREAMING or PLAYING 
                activity: {
                    name: `${newName}`,
                    type: `${newType}`,
                    url: `${newUrl}`
                }
            });

            console.log(`(NEW ACTIVITY): new update sent in channel #updates`);
            //if the message has an attachment, it will be collected by messageAttachment, else it gets a null state
            const update = new Discord.MessageEmbed()
                .setTitle("Nova Atualização!")
                .setColor('#5dbea6')
                .setDescription(`O status do Đoge Bot foi modificado para:\n **"${newType.toLowerCase()} ${newName}"** disponível em: **${newUrl}**`)
                .setThumbnail("https://i.imgur.com/Zj1a5l5.png")
                .setTimestamp()
                .setFooter(`Por: Đoge Bot#1161`)
            //if the past message had an attachment, it will set in the embed image content
         
            bot.channels.cache.get("750728830355767296").send("@everyone").then(msg => {
                setTimeout(() => msg.delete(), 1800000)
              });
            bot.channels.cache.get("750728830355767296").send(update);

            setTimeout(function () {
                msg.delete();
            }, 1000);

        } catch (e) {
            msg.delete();
            msg.reply("formato incorreto! tente novamente com **comando + tipo (playing, watching, streaming) + url + título**").then(msg => {
                setTimeout(() => msg.delete(), 10000)
            });;
        }


    }
    else {
        msg.delete();
        return msg.reply("opa! parece que você não possui permissão para efetuar este comando").then(msg => {
            setTimeout(() => msg.delete(), 10000)
        });

    }
};

module.exports = {
    name: "status",
    help: "você modifica o status do bot",
    execute,
};
