import { addCommand, client } from "../client.js"

const CommandName = "ping"
const Description = "Replies with Pong!"

addCommand({
    name: CommandName,
    description: Description,
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) { return }
    if (interaction.commandName !== CommandName) { return }
    await interaction.reply('Pong!')
})