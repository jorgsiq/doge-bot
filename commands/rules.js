const Discord = require('discord.js');

const execute = (bot, msg, args) => {
    const title = new Discord.MessageEmbed()
        .setColor('#ff9900')
        .setTitle("Đoge Style")
        .setDescription("Por favor! leia todas as **Regras de Comportamento** com muita atenção ㅤㅤㅤ ㅤㅤ ")
    //msg.author.send(ruleOne);
    //return msg.reply(`estou te enviando uma mensagem privada com mais informações!`);
    msg.author.send(title);
    msg.reply(`estou te enviando uma mensagem privada com mais informações!`);

    const ruleOne = new Discord.MessageEmbed()
        .setColor('#ff9900')
        .setTitle("🏳️‍🌈 **Igualdade & Respeito**")
        .setDescription("A comunidade **Đoge Style** é um espaço aberto e inclusivo a todos, qualquer um que cumpra com nossas regras de comportamento e respeite os demais membros poderá participar, independentemente de sua orientação sexual, gênero, classe social, posicionamento político, religiosidade ou cor da pele. Membros que demostrarem intolerância e tiverem um discurso de ódio, racista, homofóbico, machista e xenofóbico serão punidos com banimento permanente")
    //msg.author.send(ruleOne);
    //return msg.reply(`estou te enviando uma mensagem privada com mais informações!`);
    msg.author.send(ruleOne);

    const ruleTwo = new Discord.MessageEmbed()
        .setColor('#ff9900')
        .setTitle("🙂 **Arte & Cultura**")
        .setDescription("O servidor não se limita apenas a tópicos relacionados a games, mas a quaisquer outros temas que colaborem com a evolução pessoal, cultural, social ou cientifica dos membros, isto é, você pode conversar sobre qualquer coisa, contanto que isso não desrespeite alguém")
    //return msg.reply(`estou te enviando uma mensagem privada com mais informações!`);
    msg.author.send(ruleTwo);

    const ruleThree = new Discord.MessageEmbed()
        .setColor('#ff9900')
        .setTitle(":page_facing_up: **Norma Nº01**")
        .setDescription("Membros que demostrarem intolerância e discriminação, assim como realizarem discurso de ódio, racista, homofóbico, machista e xenofóbico serão punidos com banimento permanente")
    //return msg.reply(`estou te enviando uma mensagem privada com mais informações!`);
    msg.author.send(ruleThree);

    const ruleFour = new Discord.MessageEmbed()
        .setColor('#ff9900')
        .setTitle(":page_facing_up: **Norma Nº02**")
        .setDescription("Nenhuma imagem, texto ou vídeo impróprio (nudez, mutilação, violência...) é permitido no servidor, ninguém precisa conhecer seus fetiches")
    //return msg.reply(`estou te enviando uma mensagem privada com mais informações!`);
    msg.author.send(ruleFour);

    const ruleFive = new Discord.MessageEmbed()
        .setColor('#ff9900')
        .setTitle(":page_facing_up: **Norma Nº03**")
        .setDescription("É proibido o compartilhamento de capturas de tela (vídeo, conversa, links...) sem a autorização prévia de todos os participantes expostos nas mesmas")
    //return msg.reply(`estou te enviando uma mensagem privada com mais informações!`);
    msg.author.send(ruleFive);

    const ruleSix = new Discord.MessageEmbed()
        .setColor('#ff9900')
        .setTitle(":page_facing_up: **Norma Nº04**")
        .setDescription("Se ocorrer algum conflito entre membros, este deverá ser resolvido em particular. Se notarmos que isso está causando problemas na comunidade, então medidas serão tomadas")
    //return msg.reply(`estou te enviando uma mensagem privada com mais informações!`);
    msg.author.send(ruleSix);

    const ruleSeven = new Discord.MessageEmbed()
        .setColor('#ff9900')
        .setTitle(":page_facing_up: **Norma Nº05**")
        .setDescription("Cada canal tem sua própria função, use eles para suas devidas finalidades, seu mau uso será advertido. Dessa forma tudo fica organizado")
    //return msg.reply(`estou te enviando uma mensagem privada com mais informações!`);
    msg.author.send(ruleSeven);

    const ruleEight = new Discord.MessageEmbed()
        .setColor('#ff9900')
        .setTitle(":page_facing_up: **Norma Nº06**")
        .setDescription("Você pode usar todos palavrões que quiser, contanto que não seja com o objetivo de diminuir ou humilhar membros do servidor")
    //return msg.reply(`estou te enviando uma mensagem privada com mais informações!`);
    msg.author.send(ruleEight);

    const ruleNine = new Discord.MessageEmbed()
        .setColor('#ff9900')
        .setTitle("⚠️ **Atenção!**")
        .setDescription("Se notar que algum membro está infringindo as regras de comportamento, faça uma denúncia para membros com a tag **@Staff**. A punição para o descumprimento das normas aqui expressas será avaliada por membros e moderadores, tendo como base principal dois critérios: periodicidade, ou seja, se aquele usuário já fez o mesmo outras vezes e também a gravidade da infração cometida")
    //return msg.reply(`estou te enviando uma mensagem privada com mais informações!`);
    msg.author.send(ruleNine);
};

module.exports = {
    name: "rules",
    help: "você recebe as regras do servidor",
    execute,
};