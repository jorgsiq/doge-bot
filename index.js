const Discord = require("discord.js");

const fs = require("fs");
const path = require("path");

const token = "ODI0MDQ2ODYzOTc1MzE3NTE2.YFprcg.oeyD-q-5G5caBP1NuoxjhpRRn8M";
const prefix = "?";

const bot = new Discord.Client();


bot.commands = new Discord.Collection();

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

bot.on("ready", () => {
    console.log(`(NEW ACTIVITY): woof woof, "${bot.user.username}" is now online!`);
});


/*handling with users messages with command prefix*/
bot.on("message", (msg) => {
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
            console.log("(NEW ACTIVITY): Command Executed!");
        }
        catch (e) {
            console.log("(NEW ACTIVITY): Unknow Command!");
            //the command is unknown
            return msg.reply(`desculpe! eu ainda não aprendi esse truque.. `);
        }

    }
});

/*new user joined the server*/
bot.on("guildMemberAdd", (member) => {

    console.log(`(NEW ACTIVITY): @${member.user.username} joined the server`);
    //for safety, the new user must wait for 60 seconds to receive the auto-role
    setTimeout(function () {
        //the universal role "Crew" is autofilled for the new member
        let role = member.guild.roles.cache.find(role => role.name === "Crew");
        member.roles.add(role);
        console.log(`(NEW ACTIVITY): @${member.user.username} has now the role ${role}`);
    }, 60000);//time in milliseconds

    //build embed post for channel "updates"
    const updateMessage = new Discord.MessageEmbed()
        .setAuthor(member.user.tag, member.user.displayAvatarURL())
        .setColor("#ff9900")
        .setTitle("Bem-vindo(a)!")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
        .setDescription(`@**${member.user.username}** acabou de entrar na Đoge Style!`)
        .setImage("https://maimee.weebly.com/uploads/2/2/6/1/22614968/665540_orig.gif")
        .setFooter(`ID do Usuário: ${member.user}`)
    bot.channels.cache.get("750728830355767296").send(updateMessage);
    console.log(`(NEW ACTIVITY): new member welcome message has sent in the server`);

    //build embed post to send as a private message
    const welcomeMessage = new Discord.MessageEmbed()
        .setColor('#ff9900')
        .setTitle(`Fala, @${member.user.username}!`)
        .setDescription("É bom saber que agora você também faz parte da Đoge Style! \n\nAntes de embarcar nessa jornada não esqueça de ler nossas normas de convivência fixadas no canal de texto **#rules** \n\nSe precisar de ajuda ou tiver algum problema é só chamar por um **@staff** em qualquer um dos canais. Espero que se divirta!")
        .setImage("https://media1.tenor.com/images/1feaefbc236ec7dead9f225024edc24b/tenor.gif")
    member.send(welcomeMessage);
    console.log(`(NEW ACTIVITY): new member welcome private message has sent to @${member.user.username}`);

});


/*users who left or were banned in the server*/
bot.on("guildMemberRemove", member => {

    console.log(`(NEW ACTIVITY): @${member.user.username} removed from the server`);
    //build embed post for channel "updates"
    const updateMessage = new Discord.MessageEmbed()
        .setAuthor(member.user.tag, member.user.displayAvatarURL())
        .setColor('#8c8c8c')
        .setTitle(`Ah Não!`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
        .setDescription(`@**${member.user.username}** nos abandonou!`)
        .setImage("https://i.imgur.com/vWERQ46.gif")
        .setFooter(`ID do Usuário: ${member.user}`)
    bot.channels.cache.get("750728830355767296").send(updateMessage);
    console.log(`(NEW ACTIVITY): removed member message has sent in the server`);
    //build embed post to send as a private message
    /*
    const byeMessage = new Discord.MessageEmbed()
        .setColor('#8c8c8c')
        .setTitle(`Poxa, @${member.user.username}!`)
        .setDescription("Iremos sentir muito a sua falta! \n\nSe no futuro você mudar de ideia, utilize este link para voltar ao servidor: **discord.gg/7zP9mjPwDG**")
        .setImage("https://i.imgur.com/vWERQ46.gif")
    member.send(byeMessage);
    console.log(`(NEW ACTIVITY): removed member private message has sent to @${member.user.username}`);
    */

});




