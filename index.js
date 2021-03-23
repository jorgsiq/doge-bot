const Discord = require("discord.js");

const bot = new Discord.Client();
const token = "ODI0MDQ2ODYzOTc1MzE3NTE2.YFprcg.oeyD-q-5G5caBP1NuoxjhpRRn8M";

bot.login(token);
bot.on("ready", () => {
    console.log("woof woof, doge bot is online!")
});