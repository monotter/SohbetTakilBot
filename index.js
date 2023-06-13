import { client } from "./client.js";
import "./modules/runner.js"

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
})