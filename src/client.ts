import { config } from "dotenv"; config()
import { Client, ClientEvents, GatewayIntentBits, REST } from 'discord.js'
import { CommandInteractionsType, DiscordEventsMapType } from "./modules/Types.js";
export const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!)
export const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildVoiceStates] })

export const CommandInteractions: CommandInteractionsType<string> = new Map()
export const DiscordEvents: DiscordEventsMapType<keyof ClientEvents> = new Map()

client.login(process.env.DISCORD_TOKEN)

client.on('ready', () => {
    console.log(`Logged in as ${client.user!.tag}!`)
})
process.on('uncaughtException', function (err) {
  console.error(err);
});