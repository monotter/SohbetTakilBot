import { ChatInputCommandInteraction } from "discord.js"
import { addCommand, addInteraction } from "../client.js"

const CommandName = "ping"
const Description = "Replies with Pong!"

addCommand({
    name: CommandName,
    description: Description,
})

addInteraction(async (interaction: ChatInputCommandInteraction) => {
    try {
        await interaction.deferReply()
        if (!interaction.isChatInputCommand()) { return }
        if (interaction.commandName !== CommandName) { return }
        await interaction.reply('Pong!')
    } catch (error) {
        console.error(error)
        interaction[interaction.replied ? 'editReply' : 'reply']({ ephemeral: interaction.replied ?  null : true , content: `Bir hata oluştu.` })
    }
})