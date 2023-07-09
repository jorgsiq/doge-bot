const Discord = require('discord.js');
const values = require('./../values');

const execute = (bot, msg, args) => {
    //the rules are larger than allowed in embed code, so the solution was split them all and send rules one per one in dm
    const title = new Discord.MessageEmbed()
        .setColor(values.colorDoge)
        .setTitle("Đoge Style")
        .setDescription("Por favor! leia todas as **Regras de Comportamento** com muita atenção ㅤㅤㅤ ㅤㅤ ")
    msg.author.send(title);

    const ruleOne = new Discord.MessageEmbed()
        .setColor(values.colorDoge)
        .setTitle(":rainbow_flag: **Igualdade & Respeito**")
        .setDescription("A comunidade **Đoge Style** é um espaço aberto e inclusivo a todos, qualquer um que cumpra com nossas regras de comportamento e respeite os demais membros poderá participar, independentemente de sua orientação sexual, gênero, classe social, posicionamento político, religiosidade ou cor da pele. Membros que demostrarem intolerância e tiverem um discurso de ódio, racista, homofóbico, machista e xenofóbico serão punidos com banimento permanente")
    setTimeout(() => msg.author.send(ruleOne), 1000);

    const ruleTwo = new Discord.MessageEmbed()
        .setColor(values.colorDoge)
        .setTitle(":slight_smile: **Arte & Cultura**")
        .setDescription("O servidor não se limita apenas a tópicos relacionados a games, mas a quaisquer outros temas que colaborem com a evolução pessoal, cultural, social ou cientifica dos membros, isto é, você pode conversar sobre qualquer coisa, contanto que isso não desrespeite alguém")
    setTimeout(() => msg.author.send(ruleTwo), 2000);

    const ruleThree = new Discord.MessageEmbed()
        .setColor(values.colorDoge)
        .setTitle(":page_facing_up: **Norma Nº01**")
        .setDescription("Membros que demostrarem intolerância e discriminação, assim como realizarem discurso de ódio, racista, homofóbico, machista e xenofóbico serão punidos com banimento permanente")
    setTimeout(() => msg.author.send(ruleThree), 3000);

    const ruleFour = new Discord.MessageEmbed()
        .setColor(values.colorDoge)
        .setTitle(":page_facing_up: **Norma Nº02**")
        .setDescription("Nenhuma imagem, texto ou vídeo impróprio (nudez, mutilação, violência...) é permitido no servidor, ninguém precisa conhecer seus fetiches")
    setTimeout(() => msg.author.send(ruleFour), 4000);

    const ruleFive = new Discord.MessageEmbed()
        .setColor(values.colorDoge)
        .setTitle(":page_facing_up: **Norma Nº03**")
        .setDescription("É proibido o compartilhamento de capturas de tela (vídeo, conversa, links...) sem a autorização prévia de todos os participantes expostos nas mesmas")
    setTimeout(() => msg.author.send(ruleFive), 5000);

    const ruleSix = new Discord.MessageEmbed()
        .setColor(values.colorDoge)
        .setTitle(":page_facing_up: **Norma Nº04**")
        .setDescription("Se ocorrer algum conflito entre membros, este deverá ser resolvido em particular. Se notarmos que isso está causando problemas na comunidade, então medidas serão tomadas")
    setTimeout(() => msg.author.send(ruleSix), 6000);

    const ruleSeven = new Discord.MessageEmbed()
        .setColor(values.colorDoge)
        .setTitle(":page_facing_up: **Norma Nº05**")
        .setDescription("Cada canal tem sua própria função, use eles para suas devidas finalidades, seu mau uso será advertido. Dessa forma tudo fica organizado")
    setTimeout(() => msg.author.send(ruleSeven), 7000);

    const ruleEight = new Discord.MessageEmbed()
        .setColor(values.colorDoge)
        .setTitle(":page_facing_up: **Norma Nº06**")
        .setDescription("Você pode usar todos palavrões que quiser, contanto que não seja com o objetivo de diminuir ou humilhar membros do servidor")
    setTimeout(() => msg.author.send(ruleEight), 8000);

    const ruleNine = new Discord.MessageEmbed()
        .setColor(values.colorDoge)
        .setTitle(":warning: **Atenção!**")
        .setDescription("Se notar que algum membro está infringindo as regras de comportamento, faça uma denúncia para membros com a tag **@Staff**. A punição para o descumprimento das normas aqui expressas será avaliada por membros e moderadores, tendo como base principal dois critérios: periodicidade, ou seja, se aquele usuário já fez o mesmo outras vezes e também a gravidade da infração cometida")
    setTimeout(() => msg.author.send(ruleNine), 9000);

    setTimeout(function () {
        msg.delete().catch((error) => {
            console.error('Failed task with the following error:', error);
        });
    }, 300000);
    return msg.reply(`estou te enviando uma mensagem privada com mais informações!`).then(msg => {
        setTimeout(() => msg.delete(), 300000);
    }).catch((error) => {
        console.error('Failed task with the following error:', error);
    });
};

module.exports = {
    name: "rules",
    help: "\n (Info) você recebe as regras do servidor",
    execute,
};