import { client } from "../client.js";

client.on('guildMemberAdd', async (member) => {
    member.roles.add("1104727836461375620")
})