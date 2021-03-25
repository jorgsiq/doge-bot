const search = require("yt-search");

const execute = (bot, msg, args) => {
    //build a string with all the args 
    const songName = args.join(" ");

    try{
        search(songName,(err,result) => {
            if (err){

            }else{
                console.log(result);
            }
        })
    }
    catch(e){

    }


};

module.exports ={
    name: "rules",
    help: "você recebe as regras do servidor",
    execute,
};