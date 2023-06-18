import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import { client, addCommand, addInteraction } from "../../client.js";
import { model, Schema } from "mongoose";

export const AutoRolesModel = model("AutoRoles", new Schema({
    roleId: String,
    guildId: String,
}))

addCommand({
    name: "oto-rol-ekle",
    description: "Belirtilen rolü ototmatik rollere ekler.",
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Eklenecek otomatik rol", required: true },
        { name: "guncelle", type: ApplicationCommandOptionType.Boolean, description: "Sunucudaki herkesin rolleri güncellensin mi?", required: false }
    ]
})
addCommand({
    name: "oto-rol-çıkar",
    description: "Belirtilen rolü ototmatik rollerden çıkarır.",
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Kaldırılacak otomatik rol", required: true },
        { name: "guncelle", type: ApplicationCommandOptionType.Boolean, description: "Sunucudaki herkesin rolleri güncellensin mi?", required: false }
    ]
})
addCommand({
    name: "oto-rol-göster",
    description: "Sunucudaki otomatik rolleri gösterir."
})
addCommand({
    name: "oto-rol-guncelle",
    description: "Sunucudaki herkesin otomatik rollerini günceller."
})
addInteraction(async (interaction: ChatInputCommandInteraction) => {
    try {
        if (!interaction.isChatInputCommand()) { return }
        if (interaction.commandName === "oto-rol-ekle") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const roleId = interaction.options.get("rol").role.id
            let update: any = interaction.options.get("guncelle"); update = update ? update.value : update
            if (await AutoRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.editReply({  content: `Otomatik rollerde, <@&${roleId}> rolü zaten mevcut.` }); return }
            await AutoRolesModel.create({ roleId, guildId: interaction.guildId })
            await interaction.editReply({  content: `<@&${roleId}> rolü otomatik rollere eklendi.${ update ? ' Şu anda herkesin rolleri güncelleniyor..' : '' }` })

            if (update) {
                const members = await interaction.guild.members.fetch()
                const Promises = []
                members.forEach((member) => {
                    if (member.user.bot) { return }
                    if (member.roles.cache.has(roleId)) { return }
                    Promises.push(member.roles.add(roleId))
                })
                await Promise.all(Promises)
                await interaction.editReply({ content: `<@&${roleId}> rolü otomatik rollere eklendi. Herkesin rolleri güncellendi.` })
            }
        } else if (interaction.commandName === "oto-rol-çıkar") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const roleId = interaction.options.get("rol").role.id
            let update: any = interaction.options.get("guncelle"); update = update ? update.value : update
            if (!await AutoRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.editReply({  content: `Otomatik rollerde, <@&${roleId}> rolü zaten yok.` }); return }
            await AutoRolesModel.deleteOne({ roleId, guildId: interaction.guildId })
            await interaction.editReply({  content: `<@&${roleId}> rolü otomatik rollerden kaldırıldı.${ update ? ' Şu anda herkesin rolleri güncelleniyor..' : '' }` })

            if (update) {
                const members = await interaction.guild.members.fetch()
                const Promises = []
                members.forEach((member) => {
                    if (!member.roles.cache.has(roleId)) { return }
                    Promises.push(member.roles.remove(roleId))
                })
                await Promise.all(Promises)
                await interaction.editReply({ content: `<@&${roleId}> rolü otomatik rollerden kaldırıldı. Herkesin rolleri güncellendi.` })
            }
        } else if (interaction.commandName === "oto-rol-göster") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const roles = await AutoRolesModel.find({ guildId: interaction.guildId })
            if (roles.length <= 0) {
                interaction.editReply({  content: `Otomatik rollerde hiç bir rol bulunmamakta.` })
            } else {
                interaction.editReply({  content: `${roles.map(({ roleId }) => `<@&${roleId}>`).join(`, `)} rolleri otomatik rollerde mevcut.` })
            }
        } else if (interaction.commandName === "oto-rol-guncelle") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const roles = await AutoRolesModel.find({ guildId: interaction.guildId })
            const members = await interaction.guild.members.fetch()
            const Promises = []
            members.forEach((member) => {
                roles.forEach(({ roleId }) => {
                    if (member.user.bot) { return }
                    if (member.roles.cache.has(roleId)) { return }
                    Promises.push(member.roles.add(roleId))
                })
            })
            await interaction.editReply({  content: `Üyelerin otomatik rolleri güncelleniyor..` })
            await Promise.all(Promises)
            await interaction.editReply({ content: `Üyelerin otomatik rolleri güncellendi.` })
        }
    } catch (error) {
        console.error(error)
        interaction[interaction.replied || interaction.deferred ? 'editReply' : 'reply']({ ephemeral: interaction.replied || interaction.deferred ?  null : true , content: `Bir hata oluştu.` })
    }
})

client.on('guildMemberAdd', async (member) => {
    try {
        if (member.user.bot) { return }
        const roles = await AutoRolesModel.find({ guildId: member.guild.id })
        roles.forEach(({ roleId }) => {
            member.roles.add(roleId)
        })
    } catch (error) {
        console.error(error)
    }
})