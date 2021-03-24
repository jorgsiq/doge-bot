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
for (var filename of commandFiles){
    const command = require(`./commands/${filename}`);
    //name is the key in map
    bot.commands.set(command.name, command);
}


/*runs the bot, token is the argument in login*/
bot.login(token);

bot.on("ready", () => {
    console.log(`(NEW ACTIVITY): woof woof, "${bot.user.username}" is now online!`);
});

/*handling with users messages*/
bot.on("message", (msg) => {
    /*bot does nothing if the message is from a bot or it is not a known command*/
    if(!msg.content.startsWith(prefix) || msg.author.bot){
        return;
    }
    /*bot command treatment*/
    else{
        //splits the command from the command prefix
        const args = msg.content.slice(prefix.length).split(" ");
        const command = args.shift();
        
        try{ 
            //executes the command stored in collections
            bot.commands.get(command).execute(bot, msg, args)
            console.log("(NEW ACTIVITY): Command Executed!");
        } 
        catch(e){
            console.log("(NEW ACTIVITY): Unknow Command!"); 
            //the command is unknown
            //<:dug:751238735743418449>
            return msg.reply(`desculpe! eu ainda não aprendi esse truque.. `);
        }

    }
});

bot.on("guildMemberAdd", (member) => {

    console.log(`(NEW ACTIVITY): ${member.user} joined the server`);
    
    const welcomeMessage = new Discord.MessageEmbed()
        .setColor('#ff9900')
        .setTitle(`Fala, @${member.user.username}!`)
        .setDescription('É bom saber que agora você também faz parte da Đoge Style! \n\nAntes de embarcar nessa jornada não esqueça de ler nossas normas de convivência fixadas no canal de texto **#rules** \n\nSe precisar de ajuda ou tiver algum problema é só chamar por um **@staff** em qualquer um dos canais. Espero que se divirta!"')
        .setImage('https://media1.tenor.com/images/1feaefbc236ec7dead9f225024edc24b/tenor.gif')
        
    member.send(welcomeMessage); 
});



/*
bot.on("guildMemberRemove", member => {
   
});
*/



