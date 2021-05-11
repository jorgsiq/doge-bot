const execute = (bot, msg, args) => {
    setTimeout(function () {
        msg.delete();
    }, 300000);
    return msg.reply(`woof woof! <:dogLick:751238330062209025>`).then(msg => {
        setTimeout(() => msg.delete(), 300000)
    });
};

module.exports = {
    name: "hello",
    help: "cuidado! o doge vai lamber você",
    execute,
};