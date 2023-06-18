import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import { client, addCommand, addInteraction } from "../../client.js";
import { model, Schema } from "mongoose";

const BoosterRolesModel = model("BoosterRoles", new Schema({
    roleId: String,
    guildId: String,
}))

addCommand({
    name: "takviyeci-rol-ekle",
    description: "Belirtilen rolü ototmatik rollere ekler.",
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Eklenecek takviyeci rol", required: true },
        { name: "guncelle", type: ApplicationCommandOptionType.Boolean, description: "Sunucudaki herkesin rolleri güncellensin mi?", required: false }
    ]
})
addCommand({
    name: "takviyeci-rol-çıkar",
    description: "Belirtilen rolü ototmatik rollerden çıkarır.",
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Kaldırılacak takviyeci rol", required: true },
        { name: "guncelle", type: ApplicationCommandOptionType.Boolean, description: "Sunucudaki herkesin rolleri güncellensin mi?", required: false }
    ]
})
addCommand({
    name: "takviyeci-rol-göster",
    description: "Sunucudaki takviyeci rolleri gösterir."
})
addCommand({
    name: "takviyeci-rol-guncelle",
    description: "Sunucudaki herkesin takviyeci rollerini günceller."
})

addInteraction(async (interaction: ChatInputCommandInteraction) => {
    try {
        if (!interaction.isChatInputCommand()) { return }
        if (!interaction.memberPermissions.has("Administrator")) { interaction.reply({ ephemeral: true, content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
        if (interaction.commandName === "takviyeci-rol-ekle") {
            await interaction.deferReply()
            const roleId = interaction.options.get("rol").role.id
            let update: any = interaction.options.get("guncelle"); update = update ? update.value : update
            if (await BoosterRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.reply({ ephemeral: true, content: `Takviyeci rollerde, <@&${roleId}> rolü zaten mevcut.` }); return }
            await BoosterRolesModel.create({ roleId, guildId: interaction.guildId })
            await interaction.reply({ ephemeral: true, content: `<@&${roleId}> rolü takviyeci rollere eklendi.${update ? ' Şu anda herkesin rolleri güncelleniyor..' : ''}` })

            if (update) {
                const members = await interaction.guild.members.fetch()
                const Promises = []
                members.forEach((member) => {
                    if (!member.premiumSince) { return }
                    if (member.roles.cache.has(roleId)) { return }
                    Promises.push(member.roles.add(roleId))
                })
                await Promise.all(Promises)
                await interaction.editReply({ content: `<@&${roleId}> rolü takviyeci rollere eklendi. Herkesin rolleri güncellendi.` })
            }
        } else if (interaction.commandName === "takviyeci-rol-çıkar") {
            await interaction.deferReply()
            const roleId = interaction.options.get("rol").role.id
            let update: any = interaction.options.get("guncelle"); update = update ? update.value : update
            if (!await BoosterRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.reply({ ephemeral: true, content: `Takviyeci rollerde, <@&${roleId}> rolü zaten yok.` }); return }
            await BoosterRolesModel.deleteOne({ roleId, guildId: interaction.guildId })
            await interaction.reply({ ephemeral: true, content: `<@&${roleId}> rolü takviyeci rollerden kaldırıldı.${update ? ' Şu anda herkesin rolleri güncelleniyor..' : ''}` })

            if (update) {
                const members = await interaction.guild.members.fetch()
                const Promises = []
                members.forEach((member) => {
                    if (!member.roles.cache.has(roleId)) { return }
                    Promises.push(member.roles.remove(roleId))
                })
                await Promise.all(Promises)
                await interaction.editReply({ content: `<@&${roleId}> rolü takviyeci rollereden kaldırıldı. Herkesin rolleri güncellendi.` })
            }
        } else if (interaction.commandName === "takviyeci-rol-göster") {
            await interaction.deferReply()
            const roles = await BoosterRolesModel.find({ guildId: interaction.guildId })
            if (roles.length <= 0) {
                interaction.reply({ ephemeral: true, content: `Takviyeci rollerde hiç bir rol bulunmamakta.` })
            } else {
                interaction.reply({ ephemeral: true, content: `${roles.map(({ roleId }) => `<@&${roleId}>`).join(`, `)} rolleri takviyeci rollerde mevcut.` })
            }
        } else if (interaction.commandName === "takviyeci-rol-guncelle") {
            await interaction.deferReply()
            const roles = await BoosterRolesModel.find({ guildId: interaction.guildId })
            const members = await interaction.guild.members.fetch()
            const Promises = []
            members.forEach((member) => {
                roles.forEach(({ roleId }) => {
                    if (member.premiumSince) {
                        if (member.roles.cache.has(roleId)) { return }
                        Promises.push(member.roles.add(roleId))
                    } else {
                        if (!member.roles.cache.has(roleId)) { return }
                        Promises.push(member.roles.remove(roleId))
                    }
                })
            })
            await interaction.reply({ ephemeral: true, content: `Üyelerin takviyeci rolleri güncelleniyor..` })
            await Promise.all(Promises)
            await interaction.editReply({ content: `Üyelerin takviyeci rolleri güncellendi.` })
        }
    } catch (error) {
        console.error(error)
        interaction[interaction.replied ? 'editReply' : 'reply']({ ephemeral: interaction.replied ?  null : true , content: `Bir hata oluştu.` })
    }
})

client.on('guildMemberUpdate', async (_, member) => {
    try {
        const roles = await BoosterRolesModel.find({ guildId: member.guild.id })
        await member.fetch(true)
        if (member.premiumSince) {
            roles.forEach(({ roleId }) => {
                if (!member.roles.cache.has(roleId)) { return }
                member.roles.add(roleId)
            })
        } else {
            roles.forEach(({ roleId }) => {
                if (member.roles.cache.has(roleId)) { return }
                member.roles.remove(roleId)
            })
        }
    } catch (error) {
        console.error(error)
    }
})