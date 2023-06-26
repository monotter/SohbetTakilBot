import { ApplicationCommandOptionType } from "discord.js";
import { model, Schema } from "mongoose";
import { CreateChatCommand } from "../Interactor.js";

export const ManagerRolesModel = model("ManagerRoles", new Schema({
    roleId: String,
    guildId: String,
}))

CreateChatCommand({
    name: "denetleyici-rol-ekle",
    description: "Belirtilen rolü denetleyici rollerine ekler.",
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Eklenecek denetleyici rolü", required: true }
    ]
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için denetleyici değilsiniz.` }); return }
    const roleId = interaction.options.get("rol").role.id
    if (await ManagerRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.editReply({  content: `Denetleyici rollerinde, <@&${roleId}> rolü zaten mevcut.` }); return }
    await ManagerRolesModel.create({ roleId, guildId: interaction.guildId })
    await interaction.editReply({  content: `<@&${roleId}> rolü denetleyici rollerine eklendi.` })
})
CreateChatCommand({
    name: "denetleyici-rol-çıkar",
    description: "Belirtilen rolü denetleyici rollerinden çıkarır.",
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Kaldırılacak denetleyici rolü", required: true }
    ]
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için denetleyici değilsiniz.` }); return }
    const roleId = interaction.options.get("rol").role.id
    if (!await ManagerRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.editReply({  content: `Denetleyici rollerinde, <@&${roleId}> rolü zaten yok.` }); return }
    await ManagerRolesModel.deleteOne({ roleId, guildId: interaction.guildId })
    await interaction.editReply({  content: `<@&${roleId}> rolü denetleyici rollerinden kaldırıldı.` })
})
CreateChatCommand({
    name: "denetleyici-rol-göster",
    description: "Sunucudaki denetleyici rollerini gösterir."
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için denetleyici değilsiniz.` }); return }
    const roles = await ManagerRolesModel.find({ guildId: interaction.guildId })
    if (roles.length <= 0) {
        interaction.editReply({  content: `denetleyici rollerinde hiç bir rol bulunmamakta.` })
    } else {
        interaction.editReply({  content: `${roles.map(({ roleId }) => `<@&${roleId}>`).join(`, `)} rolleri denetleyici rollerinde mevcut.` })
    }
})