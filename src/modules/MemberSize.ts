import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import { model, Schema } from "mongoose";
import { addCommand, client, addInteraction } from "../client.js";

export const MemberSizeChannelModel = model("MemberSizeChannel", new Schema({
    name: String,
    channelId: String,
    guildId: String,
}))


addCommand({
    name: "üye-sayısı-kanalı-ayarla",
    description: "Üye sayısı kanalını ayarlar",
    options: [
        { name: "kanal", type: ApplicationCommandOptionType.Channel, description: "İsmi üye sayısına değişecek kanal", required: true },
        { name: "isim_sablonu", type: ApplicationCommandOptionType.String, description: "Kanalın ismi, {sayı} olarak belirttiğiniz yeri üye sayısına çevirir.", required: true }
    ]
})
addCommand({
    name: "üye-sayısı-kanalı-kaldır",
    description: "Üye sayısı kanalını iptal eder."
})
addCommand({
    name: "üye-sayısı-kanalı-göster",
    description: "Üye sayısı kanalını gösterir.",
})

addInteraction(async (interaction: ChatInputCommandInteraction) => {
    try {
        if (!interaction.isChatInputCommand()) { return }
        if (interaction.commandName === "üye-sayısı-kanalı-ayarla") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const channelId = interaction.options.get("kanal").channel.id
            const name = interaction.options.get("isim_sablonu").value
            const document = await MemberSizeChannelModel.findOne({ guildId: interaction.guildId })
            if (document) {
                await MemberSizeChannelModel.updateOne({ _id: document._id }, { channelId })
            } else {
                await MemberSizeChannelModel.create({ channelId, guildId: interaction.guildId, name })
            }
            interaction.editReply({ content: `<#${channelId}> kanalı üye sayısını gösterecek şekilde ayarlandı.` })
        } else if (interaction.commandName === "üye-sayısı-kanalı-kaldır") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const document = await MemberSizeChannelModel.findOne({ guildId: interaction.guildId })
            if (!document) { interaction.editReply({ content: `Şu anda üye sayısını gösteren bir kanal bulunmamakta.` }); return }
            await MemberSizeChannelModel.deleteOne({ _id: document._id })
            interaction.editReply({ content: `<#${document.channelId}> kanalı artık üye sayısını göstermeyecek.` })
        } else if (interaction.commandName === "üye-sayısı-kanalı-göster") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const document = await MemberSizeChannelModel.findOne({ guildId: interaction.guildId })
            if (!document) { interaction.editReply({ content: `Şu anda üye sayısını gösteren bir kanal bulunmamakta.` }); return }
            interaction.editReply({ content: `<#${document.channelId}> kanalı üye sayısını gösteriyor.` })
        }
    } catch (error) {
        console.error(error)
        interaction[interaction.replied || interaction.deferred ? 'editReply' : 'reply']({ ephemeral: interaction.replied || interaction.deferred ?  null : true , content: `Bir hata oluştu.` })
    }
})

try {
    const documents = await MemberSizeChannelModel.find({})
    documents.forEach(async ({ guildId, channelId, name }) => {
        try {
            const guild = await client.guilds.fetch(guildId)
            const channel = guild && await guild.channels.fetch(channelId)
            if (!channel) { return }
            channel.setName(name.replace("{sayı}", guild.memberCount.toString()))
        } catch (error) {
            console.error(error)
        }
    })
} catch (error) {
    console.error(error)
}
client.on("guildMemberAdd", async (member) => {
    try {
        const guild = member.guild
        const document = await MemberSizeChannelModel.findOne({ guildId: guild.id })
        if (!document) { return }
        const channel = guild && await guild.channels.fetch(document.channelId)
        if (!channel) { return }
        channel.setName(document.name.replace("{sayı}", guild.memberCount.toString()))
    } catch (error) {
        console.error(error)
    }
})
client.on("guildMemberRemove", async (member) => {
    try {
        const guild = member.guild
        const document = await MemberSizeChannelModel.findOne({ guildId: guild.id })
        if (!document) { return }
        const channel = guild && await guild.channels.fetch(document.channelId)
        if (!channel) { return }
        channel.setName(document.name.replace("{sayı}", guild.memberCount.toString()))
    } catch (error) {
        console.error(error)
    }
})