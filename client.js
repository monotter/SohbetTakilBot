import { config } from "dotenv"; config()
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js'

export const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN)
export const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences] })

const commands = [];

export function addCommand(command) {
    commands.push(command)
}
export function getCommands() {
    return commands
}

client.login(process.env.DISCORD_TOKEN);