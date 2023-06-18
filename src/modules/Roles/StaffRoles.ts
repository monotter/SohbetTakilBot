import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import { addCommand, addInteraction } from "../../client.js";
import { model, Schema } from "mongoose";

export const StaffRolesModel = model("StaffRoles", new Schema({
    roleId: String,
    guildId: String,
}))


addCommand({
    name: "yetkili-rol-ekle",
    description: "Belirtilen rolü yetkili rollerine ekler.",
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Eklenecek yetkili rolü", required: true }
    ]
})
addCommand({
    name: "yetkili-rol-çıkar",
    description: "Belirtilen rolü yetkili rollerinden çıkarır.",
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Kaldırılacak yetkili rolü", required: true }
    ]
})
addCommand({
    name: "yetkili-rol-göster",
    description: "Sunucudaki yetkili rollerini gösterir."
})

addInteraction(async (interaction: ChatInputCommandInteraction) => {
    try {
        if (!interaction.isChatInputCommand()) { return }
        if (interaction.commandName === "yetkili-rol-ekle") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const roleId = interaction.options.get("rol").role.id
            if (await StaffRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.editReply({  content: `Yetkili rollerinde, <@&${roleId}> rolü zaten mevcut.` }); return }
            await StaffRolesModel.create({ roleId, guildId: interaction.guildId })
            await interaction.editReply({  content: `<@&${roleId}> rolü yetkili rollerine eklendi.` })
        } else if (interaction.commandName === "yetkili-rol-çıkar") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const roleId = interaction.options.get("rol").role.id
            if (!await StaffRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.editReply({  content: `Yetkili rollerinde, <@&${roleId}> rolü zaten yok.` }); return }
            await StaffRolesModel.deleteOne({ roleId, guildId: interaction.guildId })
            await interaction.editReply({  content: `<@&${roleId}> rolü yetkili rollerinden kaldırıldı.` })
        } else if (interaction.commandName === "yetkili-rol-göster") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const roles = await StaffRolesModel.find({ guildId: interaction.guildId })
            if (roles.length <= 0) {
                interaction.editReply({  content: `yetkili rollerinde hiç bir rol bulunmamakta.` })
            } else {
                interaction.editReply({  content: `${roles.map(({ roleId }) => `<@&${roleId}>`).join(`, `)} rolleri yetkili rollerinde mevcut.` })
            }
        }
    } catch (error) {
        console.error(error)
        interaction[interaction.replied || interaction.deferred ? 'editReply' : 'reply']({ ephemeral: interaction.replied || interaction.deferred ?  null : true , content: `Bir hata oluştu.` })
    }
})