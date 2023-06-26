import { ApplicationCommandOptionType } from "discord.js";
import { model, Schema } from "mongoose";
import { CreateChatCommand } from "../Interactor.js";

export const DirectorRolesModel = model("DirectorRoles", new Schema({
    roleId: String,
    guildId: String,
}))

CreateChatCommand({
    name: "direktör-rol-ekle",
    description: "Belirtilen rolü direktör rollerine ekler.",
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Eklenecek direktör rolü", required: true }
    ]
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    const roleId = interaction.options.get("rol").role.id
    if (await DirectorRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.editReply({  content: `Direktör rollerinde, <@&${roleId}> rolü zaten mevcut.` }); return }
    await DirectorRolesModel.create({ roleId, guildId: interaction.guildId })
    await interaction.editReply({  content: `<@&${roleId}> rolü direktör rollerine eklendi.` })
})
CreateChatCommand({
    name: "direktör-rol-çıkar",
    description: "Belirtilen rolü direktör rollerinden çıkarır.",
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Kaldırılacak direktör rolü", required: true }
    ]
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    const roleId = interaction.options.get("rol").role.id
    if (!await DirectorRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.editReply({  content: `Direktör rollerinde, <@&${roleId}> rolü zaten yok.` }); return }
    await DirectorRolesModel.deleteOne({ roleId, guildId: interaction.guildId })
    await interaction.editReply({  content: `<@&${roleId}> rolü direktör rollerinden kaldırıldı.` })
})
CreateChatCommand({
    name: "direktör-rol-göster",
    description: "Sunucudaki direktör rollerini gösterir."
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    const roles = await DirectorRolesModel.find({ guildId: interaction.guildId })
    if (roles.length <= 0) {
        interaction.editReply({  content: `direktör rollerinde hiç bir rol bulunmamakta.` })
    } else {
        interaction.editReply({  content: `${roles.map(({ roleId }) => `<@&${roleId}>`).join(`, `)} rolleri direktör rollerinde mevcut.` })
    }
})