import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import { addCommand, addInteraction } from "../../client.js";
import { model, Schema } from "mongoose";

export const DirectorRolesModel = model("DirectorRoles", new Schema({
    roleId: String,
    guildId: String,
}))


addCommand({
    name: "direktör-rol-ekle",
    description: "Belirtilen rolü direktör rollerine ekler.",
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Eklenecek direktör rolü", required: true }
    ]
})
addCommand({
    name: "direktör-rol-çıkar",
    description: "Belirtilen rolü direktör rollerinden çıkarır.",
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Kaldırılacak direktör rolü", required: true }
    ]
})
addCommand({
    name: "direktör-rol-göster",
    description: "Sunucudaki direktör rollerini gösterir."
})

addInteraction(async (interaction: ChatInputCommandInteraction) => {
    try {
        if (!interaction.isChatInputCommand()) { return }
        if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için direktör değilsiniz.` }); return }
        if (interaction.commandName === "direktör-rol-ekle") {
            await interaction.deferReply({ ephemeral: true })
            const roleId = interaction.options.get("rol").role.id
            if (await DirectorRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.editReply({  content: `Direktör rollerinde, <@&${roleId}> rolü zaten mevcut.` }); return }
            await DirectorRolesModel.create({ roleId, guildId: interaction.guildId })
            await interaction.editReply({  content: `<@&${roleId}> rolü direktör rollerine eklendi.` })
        } else if (interaction.commandName === "direktör-rol-çıkar") {
            await interaction.deferReply({ ephemeral: true })
            const roleId = interaction.options.get("rol").role.id
            if (!await DirectorRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.editReply({  content: `Direktör rollerinde, <@&${roleId}> rolü zaten yok.` }); return }
            await DirectorRolesModel.deleteOne({ roleId, guildId: interaction.guildId })
            await interaction.editReply({  content: `<@&${roleId}> rolü direktör rollerinden kaldırıldı.` })
        } else if (interaction.commandName === "direktör-rol-göster") {
            await interaction.deferReply({ ephemeral: true })
            const roles = await DirectorRolesModel.find({ guildId: interaction.guildId })
            if (roles.length <= 0) {
                interaction.editReply({  content: `direktör rollerinde hiç bir rol bulunmamakta.` })
            } else {
                interaction.editReply({  content: `${roles.map(({ roleId }) => `<@&${roleId}>`).join(`, `)} rolleri direktör rollerinde mevcut.` })
            }
        }
    } catch (error) {
        console.error(error)
        interaction[interaction.replied ? 'editReply' : 'reply']({ ephemeral: interaction.replied ?  null : true , content: `Bir hata oluştu.` })
    }
})