const Discord = require("discord.js");


const fs = require("fs");
const path = require("path");


const token = "ODI0MDQ2ODYzOTc1MzE3NTE2.YFprcg.oeyD-q-5G5caBP1NuoxjhpRRn8M";
const prefix = "?";


const bot = new Discord.Client();
bot.commands = new Discord.Collection();
bot.queues = new Map();


/*reading javascript commands files from the directory*/
const commandFiles = fs.readdirSync(path.join(__dirname, "/commands")).filter(filename => filename.endsWith(".js"));


/*copying titles and the respective files from diretory to bot commands in discord collection*/
for (var filename of commandFiles) {
    const command = require(`./commands/${filename}`);
    //name is the key in map
    bot.commands.set(command.name, command);
}


/*runs the bot, token is the argument in login*/
bot.login(token);


/*bot startup*/
bot.on("ready", () => {
    bot.user.setPresence({
        //bot status is now online
        status: 'available',
        //bot activity setted to "Watching: Đoge Style"
        //also can be used states like: STREAMING or PLAYING 
        activity: {
            name: 'Đoge Style',
            type: 'WATCHING',
            url: 'https://github.com/jorgsiq/dogge-bot'
        }
    });
    console.log(`(NEW ACTIVITY): woof woof, "${bot.user.username}" is now online!`);
});


/*handling with users messages with and without command prefix*/
bot.on("message", (msg) => {
    //checks if it was wrote in the channel news
    if (message.channel.id.toString() == "750472762367279245") {
        console.log(`(NEW ACTIVITY): new notice sent in channel #news by @${message.author.username}`);
        //if the message have an attachment, it will be collected by messageAttachment, else it get a null state
        let messageAttachment = message.attachments.size > 0 ? message.attachments.array()[0].url : null;
        const news = new Discord.MessageEmbed()
            .setTitle("Novo Alerta!")
            .setColor('#5dbea6')
            .setDescription(message.content)
            .setTimestamp()
            .setFooter(`Por: @${message.author.tag}`)
        //if the past message had an attachment, it will setted in the embed image content
        if (messageAttachment){
            news.setImage(messageAttachment);
        }
        //iterates arround each member, the member who is a subscriber recieves a direct message with the alert
        const list = bot.guilds.cache.get("457325029433278468");
        list.members.cache.each(member => {
            if (member.roles.cache.some(role => role.name === 'Subscribed')) {
                member.send(`Você recebeu esta mensagem porque é um membro **inscrito** na nossa **newsletter**`);
                member.send(news);
                console.log(`(NEW ACTIVITY): new alert sent to @${member.user.username} as a direct message`);
            }
        });
    }
    /*bot does nothing if the message is from a bot or it is not a known command*/
    if (!msg.content.startsWith(prefix) || msg.author.bot) {
        return;
    }
    /*bot command treatment*/
    else {
        //splits the command from the command prefix
        const args = msg.content.slice(prefix.length).split(" ");
        const command = args.shift();

        try {
            //executes the command stored in collections
            bot.commands.get(command).execute(bot, msg, args)
            console.log("(NEW ACTIVITY): command executed!");
        }
        catch (e) {
            console.log("(NEW ACTIVITY): unknow command!");
            //the command is unknown
            return msg.reply(`desculpe! eu ainda não aprendi esse truque.. `);
        }
    }
});


/*when a new user joins the server*/
bot.on("guildMemberAdd", (member) => {

    console.log(`(NEW ACTIVITY): @${member.user.username} joined the server`);
    //for safety, the new user must wait for 60 seconds to receive the auto-role
    setTimeout(function () {
        //the universal role "Crew" is autofilled for the new member
        let role = member.guild.roles.cache.find(role => role.name === "Crew");
        member.roles.add(role);
        console.log(`(NEW ACTIVITY): @${member.user.username} has now the role ${role.name}`);
    }, 60000);

    //build embed post for channel "updates"
    const updateMessage = new Discord.MessageEmbed()
        .setAuthor(member.user.tag, member.user.displayAvatarURL())
        .setColor("#ffb361")
        .setTitle("Bem-vindo(a)!")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
        .setDescription(`@**${member.user.username}** acabou de entrar na Đoge Style!`)
        .setImage("https://i.imgur.com/DmzdRAk.gif")
        .setFooter(`ID do Usuário: ${member.user}`)
    bot.channels.cache.get("750728830355767296").send(updateMessage);
    console.log(`(NEW ACTIVITY): new member update message has sent in the server`);

    //build embed post to send as a private message
    const welcomeMessage = new Discord.MessageEmbed()
        .setColor('#ffb361')
        .setTitle(`Fala, @${member.user.username}!`)
        .setDescription("É bom saber que agora você também faz parte da Đoge Style! \n\nAntes de embarcar nessa jornada não esqueça de ler nossas normas de convivência fixadas no canal de texto **#rules** \n\nSe precisar de ajuda ou tiver algum problema é só chamar por um **@staff** em qualquer um dos canais. Espero que se divirta!")
        .setImage("https://i.imgur.com/aKe6a1F.gif")
    member.send(welcomeMessage);
    console.log(`(NEW ACTIVITY): new member welcome private message has sent to @${member.user.username}`);

});


/*when user left or was banned from the server*/
bot.on("guildMemberRemove", member => {
    console.log(`(NEW ACTIVITY): @${member.user.username} left the server`);
    //build embed post for channel "updates"
    const updateMessage = new Discord.MessageEmbed()
        .setAuthor(member.user.tag, member.user.displayAvatarURL())
        .setColor('#8c8c8c')
        .setTitle(`Ah Não!`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
        .setDescription(`@**${member.user.username}** nos abandonou!`)
        .setImage("https://i.imgur.com/cApLkJo.gif")
        .setFooter(`ID do Usuário: ${member.user}`)
    bot.channels.cache.get("750728830355767296").send(updateMessage);
    console.log(`(NEW ACTIVITY): removed member update has sent in the server`);
});


/*when a member changes something in profile*/
bot.on("guildMemberUpdate", (oldMember, newMember) => {
    //checks if the change is the nickname
    if (oldMember.displayName.toString() != newMember.displayName.toString()) {
        console.log(`(NEW ACTIVITY): @${oldMember.displayName} was the username before update`);
        console.log(`(NEW ACTIVITY): @${newMember.displayName} is the username after update`);
        //build embed with old and new info to send it to updates channel
        const updateMessage = new Discord.MessageEmbed()
            .setAuthor(newMember.user.tag, newMember.user.displayAvatarURL())
            .setColor('#ffb361')
            .setDescription("Teve seu **nickname** alterado\nㅤ ㅤ")
            .setImage(newMember.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
            .addFields(
                { name: `@${oldMember.displayName}`, value: `Antes`, inline: true },
                { name: `@${newMember.displayName}`, value: 'Agora', inline: true },
            )
            .setFooter(`ID do Usuário: ${newMember.user}`)
        bot.channels.cache.get("750728830355767296").send(updateMessage);
        console.log(`(NEW ACTIVITY): nickname changed update message has sent in the server`);
    }
    //checks if the change is the profile picture
    if (oldMember.displayAvatarURL != newMember.displayAvatarURL) {
        console.log(`(NEW ACTIVITY): @${newMember.displayName} updated profile picture`);
        //build embed with old and new info to send it to updates channel
        const updateMessage2 = new Discord.MessageEmbed()
            .setAuthor(newMember.user.tag, newMember.user.displayAvatarURL())
            .setColor('#ffb361')
            .setDescription(`Teve sua **foto** de perfil alterada\n\n(Nova foto de perfil)`)
            .setImage(newMember.user.displayAvatarURL({ dynamic: true, format: "png" }))
            .setThumbnail(oldMember.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
            .setFooter(`ID do Usuário: ${newMember.user}`)
        bot.channels.cache.get("750728830355767296").send(updateMessage2);
        console.log(`(NEW ACTIVITY): update photo message has sent in the server`);
    }
});





