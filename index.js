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


bot.login(token);

bot.on("ready", () => {
    console.log(`woof woof, "${bot.user.username}" is now online!`);
});

bot.on("message", (msg) => {
    if(!msg.content.startsWith(prefix) || msg.author.bot){
        return;
    } 
    else{
        const args = msg.content.slice(prefix.length).split(" ");
        const command = args.shift();
        
        try{
        bot.commands.get(command).execute(bots,msg,args)
        } catch(e){
            return msg.reply("desculpe, mas eu ainda não aprendi esse truque!")
        }

    }
});





