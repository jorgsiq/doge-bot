const execute = (bot, msg, args) => {
    setTimeout(function () {
        msg.delete().catch((error) => {
            console.error('Failed task with the following error:', error);
          });
    }, 300000);
    return msg.reply(`Woof Woof!`).then(msg => {
        setTimeout(() => msg.delete(), 300000)
    }).catch((error) => {
        console.error('Failed task with the following error:', error);
      });
};

module.exports = {
    name: "hello",
    help: "\n (Fun) irei latir",
    execute,
};