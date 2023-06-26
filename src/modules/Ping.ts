import { CreateChatCommand } from "./Interactor.js"

CreateChatCommand({
    name: "ping",
    description: "Replies with Pong!",
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    await interaction.editReply('Pong!')
})