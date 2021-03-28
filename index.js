const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");
const prefix = "?";
const dotenv = require("dotenv");

dotenv.config();

const bot = new Discord.Client();
bot.commands = new Discord.Collection();
bot.queues = new Map();

const notify = require("./builder/notify.js");
const messages = require("./builder/messages.js");

const commandFiles = fs.readdirSync(path.join(__dirname, "/commands")).filter(filename => filename.endsWith(".js"));

for (var filename of commandFiles) {
    const command = require(`./commands/${filename}`);
    bot.commands.set(command.name, command);
}

/**
 * --------------------------------------------------------------------------------------------------------------------Bot Startup
 */
bot.login(process.env.TOKEN);

bot.on("ready", () => {
    bot.user.setPresence({
        status: "available",
        //bot activity set as "Watching: Đoge Style"
        //also can be used with states like: STREAMING or PLAYING 
        activity: {
            name: "Đoge Style",
            type: "WATCHING",
            url: "https://github.com/jorgsiq/dogge-bot"
        }
    });
    console.log(`(NEW ACTIVITY): woof woof, "${bot.user.username}" is now online!`);
});
/**
 * --------------------------------------------------------------------------------------------------------------------
 */

/**
 * --------------------------------------------------------------------------------------------------------------------New Message
 */
bot.on("message", (message) => {
    //checks if it was wrote in the channel news
    if (message.channel.id.toString() == "750472762367279245") {
        //call notify to send news for subscribers
        notify.messageSubscribers(bot, message);
    }

    //checks if it is a command or wrote by a bot
    if (!message.content.startsWith(prefix) || message.author.bot) {
        return;
    }
    
    //it is a command, then...
    else {
        //...splits the command from the command prefix, key word and args
        const args = message.content.slice(prefix.length).split(" ");
        const command = args.shift();

        try {
            //executes the command stored in collection
            bot.commands.get(command).execute(bot, message, args)
            console.log("(NEW ACTIVITY): command executed!");
        }
        catch (e) {
            console.log("(NEW ACTIVITY): unknown command!");
            return message.reply(`desculpe! eu ainda não aprendi esse truque.. `);
        }
    }
});
/**
 * --------------------------------------------------------------------------------------------------------------------
 */

/**
 * --------------------------------------------------------------------------------------------------------------------New Member
 */
bot.on("guildMemberAdd", (member) => {

    console.log(`(NEW ACTIVITY): @${member.user.username} joined the server`);
    //for safety, the new user must wait for 60 seconds to receive the auto-role
    setTimeout(function () {
        //the universal role "Crew" is autofilled for the new member
        let role = member.guild.roles.cache.find(role => role.name === "Crew");
        member.roles.add(role);
        console.log(`(NEW ACTIVITY): @${member.user.username} has now the role ${role.name}`);
    }, 60000);
    //build embed
    messages.newUserMessage(bot, member);
    //build embed
    messages.newUserUpdate(member);

});
/**
 * --------------------------------------------------------------------------------------------------------------------
 */

/**
 * --------------------------------------------------------------------------------------------------------------------Member Left
 */
bot.on("guildMemberRemove", member => {
    console.log(`(NEW ACTIVITY): @${member.user.username} left the server`);
    //build embed
    messages.memberRemoved(bot, member);
});
/**
 * --------------------------------------------------------------------------------------------------------------------
 */

/**
 * --------------------------------------------------------------------------------------------------------------------Profile Update
 */
bot.on("guildMemberUpdate", (oldMember, newMember) => {
    //checks if the change is the nickname
    if (oldMember.displayName.toString() != newMember.displayName.toString()) {
        console.log(`(NEW ACTIVITY): @${oldMember.user.username} changed username. @${oldMember.displayName} was the username before update, @${newMember.displayName} is the username after update`);
        //build embed
        messages.usernameUpdate(bot, oldMember, newMember);
    }
    //checks if the change is the profile picture
    if (oldMember.displayAvatarURL != newMember.displayAvatarURL) {
        console.log(`(NEW ACTIVITY): @${newMember.user.username} updated profile picture`);
        //build embed
        messages.photoUpdate(bot, oldMember, newMember);
    }
});
/**
 * --------------------------------------------------------------------------------------------------------------------
 */






