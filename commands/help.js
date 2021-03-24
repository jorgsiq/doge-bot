const execute = (bot, msg, args) => {
    return msg.reply("woof woof!");
}

module.exports ={
    name: "help",
    help: "the dog shows the commands instructions.",
    execute,
}