const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");
require('dotenv').config();

const token = process.env.DOGE_KEY;
const prefix = "?";

const bot = new Discord.Client({
  partials: ["MEMBER", "MESSAGE", "CHANNEL", "USER", "REACTION"],
  disableEveryone: false,
});

bot.commands = new Discord.Collection();
bot.queues = new Map();

const notify = require("./builder/notify.js");
const messages = require("./builder/messages.js");
const clean = require("./builder/clean.js");
const values = require('./values.js');

const commandFiles = fs
  .readdirSync(path.join(__dirname, "/commands"))
  .filter((filename) => filename.endsWith(".js"));

for (var filename of commandFiles) {
  const command = require(`./commands/${filename}`);
  bot.commands.set(command.name, command);
}
/**
 * --------------------------------------------------------------------------------------------------------------------Bot Startup
 */
bot.login(token);

bot.on("ready", () => {
  bot.user.setPresence({
    status: "available",
    //bot activity set as "Watching: Đoge Style"
    //also can be used with states like: STREAMING or PLAYING
    activity: {
      name: "Đoge Style",
      type: "WATCHING",
      url: "https://github.com/jorgsiq/doge-bot",
    },
  });

  clean.cleanBulk(bot);
});
/**
 * --------------------------------------------------------------------------------------------------------------------New Message
 */
bot.on("message", (message) => {
  //channels for images only
  if (
    values.imageOnlyChannels.includes(message.channel.id.toString()) && !message.author.bot
  ) {
    if (!(message.attachments.size > 0)) {
      message.delete().catch((error) => {
        console.error('Failed task with the following error:', error);
      });
      return message
        .reply(
          "Opa! Parece que você não anexou nenhuma imagem ou vídeo, tente novamente.."
        )
        .then((msg) => {
          setTimeout(() => msg.delete(), 10000);
        }).catch((error) => {
          console.error('Failed task with the following error:', error);
        });
    }
  }
  //sends message to alerts and to the subscribers
  if (
    message.channel.id.toString() == values.alertsNotificationId  &&
    !message.author.bot
  ) {
    //call notify to send news for subscribers
    try {
      notify.messageSubscribers(bot, message);
    } catch (e) {
      return message.reply(`Desculpe! Ocorreu um erro.. `).then((msg) => {
        setTimeout(() => msg.delete(), 10000);
      }).catch((error) => {
        console.error('Failed task with the following error:', error);
      });
    }
  }

  //sends message to alerts but do not notifies subscribers
  if (
    message.channel.id.toString() == values.newsNotificationId &&
    !message.author.bot
  ) {
    try {
      messages.notify(bot, message);
    } catch (e) {
      return message.reply(`Desculpe! Ocorreu um erro.. `).then((msg) => {
        setTimeout(() => msg.delete(), 10000);
      }).catch((error) => {
        console.error('Failed task with the following error:', error);
      });
    }
  }

  //send embed message to a specific channel by passing the channel id
  if (
    message.channel.id.toString() == values.embedNotificationId &&
    !message.author.bot
  ) {
    try {
      messages.embed(bot, message);
    } catch (e) {
      return message.reply(`Desculpe! ocorreu um erro.. `).then((msg) => {
        setTimeout(() => msg.delete(), 10000);
      }).catch((error) => {
        console.error('Failed task with the following error:', error);
      });
    }
  }

  //checks if it is not a command or wrote by a bot
  if (!message.content.startsWith(prefix) || message.author.bot) {
    if (
      message.channel.id.toString() == values.commandsChannelId &&
      !message.author.bot
    ) {
      message.delete().catch((error) => {
        console.error('Failed task with the following error:', error);
      });
      message
        .reply(
          `Lembre-se que no canal <#${values.commandsChannelId}> você só pode utilizar comandos no formato "**?command**", por isso apaguei sua mensagem..`
        )
        .then((msg) => {
          setTimeout(() => msg.delete(), 10000);
        }).catch((error) => {
          console.error('Failed task with the following error:', error);
        });
    }
    return;
  }

  //it is a command, then...
  else {
    if (
      message.content.startsWith(prefix) &&
      message.channel.id.toString() != values.commandsChannelId &&
      !message.channel.type == "dm"
    ) {
      /* if (message.channel.type == "dm") {
                 message.author.send("You are DMing me now!");
                 return;
             }*/
      (message.channel.type == "dm");
      message.delete().catch((error) => {
        console.error('Failed task with the following error:', error);
      });
      message
        .reply(
          `Desculpe! mas você não pode utilizar comandos fora do canal <#${values.commandsChannelId}>, por isso apaguei sua mensagem..`
        )
        .then((msg) => {
          setTimeout(() => msg.delete(), 10000);
        }).catch((error) => {
          console.error('Failed task with the following error:', error);
        });
    } else {
      //...splits the command from the command prefix, key word and args
      const args = message.content.slice(prefix.length).split(" ");
      const command = args.shift();

      if (message.channel.type == "dm" && command != "post") {
        message.reply(
          `Desculpe! mas você não pode utilizar comandos fora do canal <#${values.commandsChannelId}>..`
        );
      } else if (!(message.channel.type == "dm") && command == "post") {
        message.delete().catch((error) => {
          console.error('Failed task with the following error:', error);
        });
        message
          .reply(
            `Desculpe! mas você só pode executar este comando em uma conversa privada com o **Đoge Bot**..`
          )
          .then((msg) => {
            setTimeout(() => msg.delete(), 10000);
          }).catch((error) => {
            console.error('Failed task with the following error:', error);
          });
      } else {
        try {
          //executes the command stored in collection
          bot.commands.get(command).execute(bot, message, args);

        } catch (e) {

          message.delete().catch((error) => {
            console.error('Failed task with the following error:', error);
          });
          return message
            .reply(`Desculpe! eu ainda não aprendi esse truque.. `)
            .then((msg) => {
              setTimeout(() => msg.delete(), 10000);
            }).catch((error) => {
              console.error('Failed task with the following error:', error);
            });
        }
      }
    }
  }
});
/**
 * --------------------------------------------------------------------------------------------------------------------New Member
 */
bot.on("guildMemberAdd", (member) => {
  //for safety, the new user must wait for 60 seconds to receive the auto-role
  setTimeout(function () {
    //the universal role "Crew" is autofilled for the new member
    let role = member.guild.roles.cache.find((role) => role.name === "Crew");
    member.roles.add(role);

  }, 60000);
  //build embed
  messages.newUserMessage(bot, member);
  //build embed
  messages.newUserUpdate(member);
});
/**
 * --------------------------------------------------------------------------------------------------------------------Member Left
 */
bot.on("guildMemberRemove", (member) => {
  //build embed
  messages.memberRemoved(bot, member);
});
/**
 * --------------------------------------------------------------------------------------------------------------------Profile Update
 */
bot.on("guildMemberUpdate", (oldMember, newMember) => {
  //checks if the change is the nickname
  if (oldMember.displayName != newMember.displayName) {

    //build embed
    messages.usernameUpdate(bot, oldMember, newMember);
  }

  //checks if the change is the profile picture
  if (oldMember.user.displayAvatarURL() != newMember.user.displayAvatarURL()) {

    //build embed
    messages.photoUpdate(bot, oldMember, newMember);
  }
});
/**
 * --------------------------------------------------------------------------------------------------------------------Message Reaction (Addition)
 */
bot.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.partial) await reaction.fetch;
  if (user.bot) return;
  if (!reaction.message.guild) return;

  if (reaction.message.id === values.reactNsfwId) {
    let channel;
    if (reaction.emoji.name === "🍑") {
      channel = bot.channels.cache.get(values.nsfw1ChannelId);
      channel
        .updateOverwrite(user, {
          VIEW_CHANNEL: true,
        })
        .then((channel) =>
          (channel.permissionOverwrites.get(user.id))
        )
        .catch(console.error);

      const upd = new Discord.MessageEmbed()
        .setTitle(`Acesso Desbloqueado 🍑`)
        .setColor(values.colorGreen)
        .setAuthor(user.tag, user.displayAvatarURL())
        .setDescription(
          "Maravilha! Agora você já pode acessar e publicar conteúdo **NSFW** de acordo com as suas preferências. O conteúdo publicado pode ser seu, de alguém que você conhece/admira ou de uma figura pública, contanto que seja **material de circulação consensual na internet**, podendo contar ou não com nudez explícita e teor sexual. **Divirta-se!**"
        )
        .setTimestamp()
        .setFooter("#NSFWGIRL, +18");
      user.send(upd);

      const rule2 = new Discord.MessageEmbed()
        .setColor(values.colorGreen)
        .setDescription(
          "Utilize sempre o comando **?Post Pin @username** conforme os seguintes exemplos: **?Post nsfwgirl @bellekaffer** ou omitindo o username da pessoa presente na mídia como em: **?Post nsfwgirl**"
        );
      user.send(rule2);

      const rule3 = new Discord.MessageEmbed()
        .setColor("values.colorRed")
        .setDescription(
          "**ATENÇÃO!** Conteúdo que se caracterize por crime e/ou que não possua relação com o tópico resultará em rastreamento e identificação do envolvido"
        );
      user.send(rule3);

      const rule4 = new Discord.MessageEmbed()
        .setColor("values.colorRed")
        .setDescription(
          "**ATENÇÃO!** Por favor, não apague as mídias enviadas neste chat, isso fará com que elas desapareçam também do servidor. Em alternativa apenas exclua a conversa com o Đoge Bot"
        );
      user.send(rule4);

    }
    if (reaction.emoji.name === "🍆") {
      channel = bot.channels.cache.get(values.nsfw2ChannelId);
      channel
        .updateOverwrite(user, {
          VIEW_CHANNEL: true,
        })
        .then((channel) =>
          (channel.permissionOverwrites.get(user.id))
        )
        .catch(console.error);

      const upd = new Discord.MessageEmbed()
        .setTitle(`Acesso Desbloqueado 🍆`)
        .setColor(values.colorGreen)
        .setAuthor(user.tag, user.displayAvatarURL())
        .setDescription(
          "Maravilha! Agora você já pode acessar e publicar conteúdo **NSFW** de acordo com as suas preferências. O conteúdo publicado pode ser seu, de alguém que você conhece/admira ou de uma figura pública, contanto que seja **material de circulação consensual na internet**, podendo contar ou não com nudez explícita e teor sexual. **Aproveite!**"
        )
        .setTimestamp()
        .setFooter("#NSFWBOY, +18");
      user.send(upd);

      const rule2 = new Discord.MessageEmbed()
        .setColor(values.colorGreen)
        .setDescription(
          "Utilize sempre o comando **?Post Pin @username** conforme os seguintes exemplos: **?Post nsfwboy @tchalamet** ou omitindo o username da pessoa presente na mídia como em: **?Post nsfwboy**"
        );
      user.send(rule2);

      const rule3 = new Discord.MessageEmbed()
        .setColor("values.colorRed")
        .setDescription(
          "**ATENÇÃO!** Conteúdo que se caracterize por crime e/ou que não possua relação com o tópico resultará em rastreamento e identificação do envolvido"
        );
      user.send(rule3);

      const rule4 = new Discord.MessageEmbed()
        .setColor("values.colorRed")
        .setDescription(
          "**ATENÇÃO!** Por favor, não apague as mídias enviadas neste chat, isso fará com que elas desapareçam também do servidor. Em alternativa apenas exclua a conversa com o Đoge Bot"
        );
      user.send(rule4);
    }
    if (reaction.emoji.name === "💦") {
      channel = bot.channels.cache.get(values.nsfw2ChannelId);
      channel
        .updateOverwrite(user, {
          VIEW_CHANNEL: true,
        })
        .then((channel) =>
          (channel.permissionOverwrites.get(user.id))
        )
        .catch(console.error);
      channel = bot.channels.cache.get(values.nsfw1ChannelId);
      channel
        .updateOverwrite(user, {
          VIEW_CHANNEL: true,
        })
        .then((channel) =>
          (channel.permissionOverwrites.get(user.id))
        )
        .catch(console.error);

      const upd = new Discord.MessageEmbed()
        .setTitle(`Acesso Desbloqueado 💦`)
        .setColor(values.colorGreen)
        .setAuthor(user.tag, user.displayAvatarURL())
        .setDescription(
          "Maravilha! Agora você já pode acessar e publicar conteúdo **NSFW** de acordo com as suas preferências. O conteúdo publicado pode ser seu, de alguém que você conhece/admira ou de uma figura pública, contanto que seja **material de circulação consensual na internet**, podendo contar ou não com nudez explícita e teor sexual. **Aproveite!**"
        )
        .setTimestamp()
        .setFooter("#NSFWGIRL, #NSFWBOY, +18");
      user.send(upd);

      const rule2 = new Discord.MessageEmbed()
        .setColor(values.colorGreen)
        .setDescription(
          "Utilize sempre o comando **?Post Pin @username** conforme os seguintes exemplos: **?Post nsfwboy @username** ou omitindo o username da pessoa presente na mídia como em: **?Post nsfwgirl**"
        );
      user.send(rule2);

      const rule3 = new Discord.MessageEmbed()
        .setColor("values.colorRed")
        .setDescription(
          "**ATENÇÃO!** Conteúdo que se caracterize por crime e/ou que não possua relação com o tópico resultará em rastreamento e identificação do envolvido"
        );
      user.send(rule3);

      const rule4 = new Discord.MessageEmbed()
        .setColor("values.colorRed")
        .setDescription(
          "**ATENÇÃO!** Por favor, não apague as mídias enviadas neste chat, isso fará com que elas desapareçam também do servidor. Em alternativa apenas exclua a conversa com o Đoge Bot"
        );
      user.send(rule4);

    }
  }

  if (reaction.message.id === values.reactClubId) {
    let role;
    let name;
    if (reaction.emoji.name === "🐲") {
      name = "Anime Club 🐲";
      role = values.animeClubId;
    }
    if (reaction.emoji.name === "🎨") {
      name = "Art Club 🎨";
      role = values.artClubId;
    }
    if (reaction.emoji.name === "🎥") {
      name = "Cinema Club 🎥";
      role = values.cinemaClubId;
    }
    if (reaction.emoji.name === "🌈") {
      name = "LGBT 🌈";
      role = values.lgbtClubId ;
    }
    if (reaction.emoji.name === "📚") {
      name = "Reading Club 📚";
      role = values.readingClubId;
    }
    if (reaction.emoji.name === "🌱") {
      name = "Veggie 🌱";
      role = values.veggieClubId;
    }

    await reaction.message.guild.members.cache
      .get(user.id)
      .roles.add(role);

    const update = new Discord.MessageEmbed()
      .setTitle(`${name}`)
      .setColor(values.colorDoge)
      .setAuthor(user.tag, user.displayAvatarURL())
      .setDescription("Agora faz parte de uma nova comunidade!")
      .setFooter(`ID do Usuário: ${user.id}`);

    bot.channels.cache
      .get(values.updatesChannelId)
      .send(`${user}`)
      .then((msg) => {
        setTimeout(() => msg.delete(), 1800000);
      }).catch((error) => {
        console.error('Failed task with the following error:', error);
      });
    bot.channels.cache.get(values.updatesChannelId).send(update);
  }
});
/**
 * --------------------------------------------------------------------------------------------------------------------Message Reaction (Remotion)
 */
bot.on("messageReactionRemove", async (reaction, user) => {
  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.partial) await reaction.fetch;
  if (user.bot) return;
  if (!reaction.message.guild) return;

  if (reaction.message.id === values.reactNsfwId) {
    let channel;
    if (reaction.emoji.name === "🍑") {
      channel = bot.channels.cache.get(values.nsfw1ChannelId);
      channel
        .updateOverwrite(user, {
          VIEW_CHANNEL: false,
        })
        .then((channel) =>
          (channel.permissionOverwrites.get(user.id))
        )
        .catch(console.error);
    }
    if (reaction.emoji.name === "🍆") {
      channel = bot.channels.cache.get(values.nsfw2ChannelId);
      channel
        .updateOverwrite(user, {
          VIEW_CHANNEL: false,
        })
        .then((channel) =>
          (channel.permissionOverwrites.get(user.id))
        )
        .catch(console.error);
    }
    if (reaction.emoji.name === "💦") {
      channel = bot.channels.cache.get(values.nsfw3ChannelId);
      channel
        .updateOverwrite(user, {
          VIEW_CHANNEL: false,
        })
        .then((channel) =>
          (channel.permissionOverwrites.get(user.id))
        )
        .catch(console.error);
    }
  }
  if (reaction.message.id === values.reactClubId) {
    let role;
    let name;
    if (reaction.emoji.name === "🐲") {
      name = "Anime Club 🐲";
      role = values.animeClubId;
    }
    if (reaction.emoji.name === "🎨") {
      name = "Art Club 🎨";
      role = values.artClubId;
    }
    if (reaction.emoji.name === "🎥") {
      name = "Cinema Club 🎥";
      role = values.cinemaClubId;
    }
    if (reaction.emoji.name === "🌈") {
      name = "LGBT 🌈";
      role = values.lgbtClubId ;
    }
    if (reaction.emoji.name === "📚") {
      name = "Reading Club 📚";
      role = values.readingClubId;
    }
    if (reaction.emoji.name === "🌱") {
      name = "Veggie 🌱";
      role = values.veggieClubId;
    }

    await reaction.message.guild.members.cache
      .get(user.id)
      .roles.remove(role);

    const update = new Discord.MessageEmbed()
      .setTitle(`${name}`)
      .setColor(values.colorGrey)
      .setAuthor(user.tag, user.displayAvatarURL())
      .setDescription("Agora não faz mais parte desta comunidade!")
      .setFooter(`ID do Usuário: ${user.id}`);

    bot.channels.cache
      .get(values.updatesChannelId)
      .send(`${user}`)
      .then((msg) => {
        setTimeout(() => msg.delete(), 1800000);
      }).catch((error) => {
        console.error('Failed task with the following error:', error);
      });

    bot.channels.cache.get(values.updatesChannelId).send(update);

  }
});
