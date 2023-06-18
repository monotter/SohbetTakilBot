import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import { addCommand, addInteraction } from "../../client.js";
import { model, Schema } from "mongoose";

export const ManagerRolesModel = model("ManagerRoles", new Schema({
    roleId: String,
    guildId: String,
}))


addCommand({
    name: "denetleyici-rol-ekle",
    description: "Belirtilen rolü denetleyici rollerine ekler.",
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Eklenecek denetleyici rolü", required: true }
    ]
})
addCommand({
    name: "denetleyici-rol-çıkar",
    description: "Belirtilen rolü denetleyici rollerinden çıkarır.",
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Kaldırılacak denetleyici rolü", required: true }
    ]
})
addCommand({
    name: "denetleyici-rol-göster",
    description: "Sunucudaki denetleyici rollerini gösterir."
})

addInteraction(async (interaction: ChatInputCommandInteraction) => {
    try {
        if (!interaction.isChatInputCommand()) { return }
        if (!interaction.memberPermissions.has("Administrator")) { interaction.reply({ ephemeral: true, content: `Bu komutu kullanabilmek için denetleyici değilsiniz.` }); return }
        if (interaction.commandName === "denetleyici-rol-ekle") {
            await interaction.deferReply()
            const roleId = interaction.options.get("rol").role.id
            if (await ManagerRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.reply({ ephemeral: true, content: `Denetleyici rollerinde, <@&${roleId}> rolü zaten mevcut.` }); return }
            await ManagerRolesModel.create({ roleId, guildId: interaction.guildId })
            await interaction.reply({ ephemeral: true, content: `<@&${roleId}> rolü denetleyici rollerine eklendi.` })
        } else if (interaction.commandName === "denetleyici-rol-çıkar") {
            await interaction.deferReply()
            const roleId = interaction.options.get("rol").role.id
            if (!await ManagerRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.reply({ ephemeral: true, content: `Denetleyici rollerinde, <@&${roleId}> rolü zaten yok.` }); return }
            await ManagerRolesModel.deleteOne({ roleId, guildId: interaction.guildId })
            await interaction.reply({ ephemeral: true, content: `<@&${roleId}> rolü denetleyici rollerinden kaldırıldı.` })
        } else if (interaction.commandName === "denetleyici-rol-göster") {
            await interaction.deferReply()
            const roles = await ManagerRolesModel.find({ guildId: interaction.guildId })
            if (roles.length <= 0) {
                interaction.reply({ ephemeral: true, content: `denetleyici rollerinde hiç bir rol bulunmamakta.` })
            } else {
                interaction.reply({ ephemeral: true, content: `${roles.map(({ roleId }) => `<@&${roleId}>`).join(`, `)} rolleri denetleyici rollerinde mevcut.` })
            }
        }
    } catch (error) {
        console.error(error)
        interaction[interaction.replied ? 'editReply' : 'reply']({ ephemeral: interaction.replied ?  null : true , content: `Bir hata oluştu.` })
    }
})