import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import { client, addCommand, addInteraction } from "../../client.js";
import { model, Schema } from "mongoose";

const BotRolesModel = model("BotRoles", new Schema({
    roleId: String,
    guildId: String,
}))


addCommand({
    name: "bot-rol-ekle",
    description: "Belirtilen rolü bot rollerine ekler.",
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Eklenecek bot rolü", required: true },
        { name: "guncelle", type: ApplicationCommandOptionType.Boolean, description: "Sunucudaki herkesin rolleri güncellensin mi?", required: false }
    ]
})
addCommand({
    name: "bot-rol-çıkar",
    description: "Belirtilen rolü bot rollerinden çıkarır.",
    options: [
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Kaldırılacak bot rolü", required: true },
        { name: "guncelle", type: ApplicationCommandOptionType.Boolean, description: "Sunucudaki herkesin rolleri güncellensin mi?", required: false }
    ]
})
addCommand({
    name: "bot-rol-göster",
    description: "Sunucudaki bot rollerini gösterir."
})
addCommand({
    name: "bot-rol-guncelle",
    description: "Sunucudaki botların rollerini günceller."
})

addInteraction(async (interaction: ChatInputCommandInteraction) => {
    try {
        if (!interaction.isChatInputCommand()) { return }
        if (interaction.commandName === "bot-rol-ekle") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const roleId = interaction.options.get("rol").role.id
            let update: any = interaction.options.get("guncelle"); update = update ? update.value : update
            if (await BotRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.editReply({  content: `Bot rollerinde, <@&${roleId}> rolü zaten mevcut.` }); return }
            await BotRolesModel.create({ roleId, guildId: interaction.guildId })
            await interaction.editReply({  content: `<@&${roleId}> rolü bot rollerine eklendi.${update ? ' Şu anda tüm botların rolleri güncelleniyor..' : ''}` })

            if (update) {
                const members = await interaction.guild.members.fetch()
                const Promises = []
                members.forEach((member) => {
                    if (!member.user.bot) { return }
                    if (member.roles.cache.has(roleId)) { return }
                    Promises.push(member.roles.add(roleId))
                })
                await Promise.all(Promises)
                await interaction.editReply({ content: `<@&${roleId}> rolü bot rollerine eklendi. Tüm botların rolleri güncellendi.` })
            }
        } else if (interaction.commandName === "bot-rol-çıkar") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const roleId = interaction.options.get("rol").role.id
            let update: any = interaction.options.get("guncelle"); update = update ? update.value : update
            if (!await BotRolesModel.findOne({ roleId, guildId: interaction.guildId })) { interaction.editReply({  content: `Bot rollerinde, <@&${roleId}> rolü zaten yok.` }); return }
            await BotRolesModel.deleteOne({ roleId, guildId: interaction.guildId })
            await interaction.editReply({  content: `<@&${roleId}> rolü bot rollerinden kaldırıldı.${update ? ' Şu anda tüm botların rolleri güncelleniyor..' : ''}` })

            if (update) {
                const members = await interaction.guild.members.fetch()
                const Promises = []
                members.forEach((member) => {
                    if (!member.roles.cache.has(roleId)) { return }
                    Promises.push(member.roles.remove(roleId))
                })
                await Promise.all(Promises)
                await interaction.editReply({ content: `<@&${roleId}> rolü bot rollerinden kaldırıldı. Tüm botların rolleri güncellendi.` })
            }
        } else if (interaction.commandName === "bot-rol-göster") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const roles = await BotRolesModel.find({ guildId: interaction.guildId })
            if (roles.length <= 0) {
                interaction.editReply({  content: `Bot rollerinde hiç bir rol bulunmamakta.` })
            } else {
                interaction.editReply({  content: `${roles.map(({ roleId }) => `<@&${roleId}>`).join(`, `)} rolleri bot rollerinde mevcut.` })
            }
        } else if (interaction.commandName === "bot-rol-guncelle") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const roles = await BotRolesModel.find({ guildId: interaction.guildId })
            const members = await interaction.guild.members.fetch()
            const Promises = []
            members.forEach((member) => {
                roles.forEach(({ roleId }) => {
                    if (member.user.bot) {
                        if (member.roles.cache.has(roleId)) { return }
                        Promises.push(member.roles.add(roleId))
                    } else {
                        if (!member.roles.cache.has(roleId)) { return }
                        Promises.push(member.roles.remove(roleId))
                    }
                })
            })
            await interaction.editReply({  content: `Botların rolleri güncelleniyor..` })
            await Promise.all(Promises)
            await interaction.editReply({ content: `Botların rolleri güncellendi.` })
        }
    } catch (error) {
        console.error(error)
        interaction[interaction.replied ? 'editReply' : 'reply']({ ephemeral: interaction.replied ?  null : true , content: `Bir hata oluştu.` })
    }
})

client.on('guildMemberAdd', async (member) => {
    try {
        if (!member.user.bot) { return }
        const roles = await BotRolesModel.find({ guildId: member.guild.id })
        roles.forEach(({ roleId }) => {
            member.roles.add(roleId)
        })
    } catch (error) {
        console.error(error)
    }
})