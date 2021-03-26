const execute = (bot, msg, args) => {
    return msg.reply("woof woof! <:dogLick:751238330062209025>");
};

module.exports ={
    name: "hello",
    help: "cuidado! o doge vai lamber você",
    execute,
};