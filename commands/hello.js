const execute = (bot, msg, args) => {
    return msg.reply("woof woof!");
}

module.exports ={
    name: "hello",
    help: "the dog answers you.",
    execute,
}