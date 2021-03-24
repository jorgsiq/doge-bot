const execute = (bot, msg, args) => {
    msg.author.send('text');
    return msg.reply(`estou enviando minha lista de truques no seu privado!`);
}

module.exports ={
    name: "help",
    execute,
}