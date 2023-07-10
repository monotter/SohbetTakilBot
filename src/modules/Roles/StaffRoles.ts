import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { model, Schema } from "mongoose";
import { CreateChatCommand } from "../Interactor.js";

export const StaffRolesModel = model("StaffRoles", new Schema({
    roleId: String,
    guildId: String,
}))

CreateChatCommand({
    name: "yetkili-rol-ekle",
    description: "Belirtilen rolü yetkili rollerine ekler.",
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Eklenecek yetkili rolü", required: true }
    ]
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
    const roleId = interaction.options.get("rol").role.id
    if (await StaffRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.editReply({  content: `Yetkili rollerinde, <@&${roleId}> rolü zaten mevcut.` }); return }
    await StaffRolesModel.create({ roleId, guildId: interaction.guildId })
    await interaction.editReply({  content: `<@&${roleId}> rolü yetkili rollerine eklendi.` })
})
CreateChatCommand({
    name: "yetkili-rol-çıkar",
    description: "Belirtilen rolü yetkili rollerinden çıkarır.",
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Kaldırılacak yetkili rolü", required: true }
    ]
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
    const roleId = interaction.options.get("rol").role.id
    if (!await StaffRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.editReply({  content: `Yetkili rollerinde, <@&${roleId}> rolü zaten yok.` }); return }
    await StaffRolesModel.deleteOne({ roleId, guildId: interaction.guildId })
    await interaction.editReply({  content: `<@&${roleId}> rolü yetkili rollerinden kaldırıldı.` })
})
CreateChatCommand({
    name: "yetkili-rol-göster",
    description: "Sunucudaki yetkili rollerini gösterir.",
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
    const roles = await StaffRolesModel.find({ guildId: interaction.guildId })
    if (roles.length <= 0) {
        interaction.editReply({  content: `yetkili rollerinde hiç bir rol bulunmamakta.` })
    } else {
        interaction.editReply({  content: `${roles.map(({ roleId }) => `<@&${roleId}>`).join(`, `)} rolleri yetkili rollerinde mevcut.` })
    }
})