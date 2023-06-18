import { config } from "dotenv"; config()
import { Client, GatewayIntentBits, Interaction, REST } from 'discord.js'
import { RawApplicationCommandData } from "discord.js/typings/rawDataTypes.js";
export const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!)
export const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences] })

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

const commands: PartialBy<RawApplicationCommandData, "id" | "application_id" | "type" | "version" | "default_member_permissions">[] = [];
export function addCommand(command: (typeof commands)[number]) {
    commands.push(command)
}
export function getCommands() {
    return commands
}


const interactions: ((interaction: Interaction) => any)[] = [];
export function addInteraction(interaction: (interaction: Interaction) => any) {
    interactions.push(interaction)
}
export function getInteractions() {
    return interactions
}

client.login(process.env.DISCORD_TOKEN)

client.on('ready', () => {
    console.log(`Logged in as ${client.user!.tag}!`)
})