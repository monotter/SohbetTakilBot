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
        if (!interaction.isChatInputCommand()) { return }
        if (interaction.commandName !== CommandName) { return }
        await interaction.deferReply({ ephemeral: true })
        await interaction.editReply('Pong!')
    } catch (error) {
        console.error(error)
        interaction[interaction.replied || interaction.deferred ? 'editReply' : 'reply']({ ephemeral: interaction.replied || interaction.deferred ?  null : true , content: `Bir hata oluştu.` })
    }
})