import { client } from "../client.js";

client.guilds.fetch("1101999189640106115").then((guild) => {
    setInterval(async function () {
        var memberCount = guild.memberCount;
        var memberCountChannel = await client.channels.fetch("1118199600155721738");
        memberCountChannel.setName(`👪】${memberCount} Üye【👪`);
    }, 1000)
})