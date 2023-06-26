import { ApplicationCommandOptionType } from "discord.js";
import { client } from "../client.js";
import { CreateChatCommand, CreateEvent } from "./Interactor.js";
import { GetServerSetting, ServerSettingsCache, SetServerSetting } from "./ServerSettings.js";

CreateChatCommand({
    name: "üye-sayısı-kanalı-ayarla",
    description: "Üye sayısı kanalını ayarlar",
    options: [
        { name: "kanal", type: ApplicationCommandOptionType.Channel, description: "İsmi üye sayısına değişecek kanal", required: true },
        { name: "isim_sablonu", type: ApplicationCommandOptionType.String, description: "Kanalın ismi, {sayı} olarak belirttiğiniz yeri üye sayısına çevirir.", required: true }
    ]
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
    const channelId = interaction.options.get("kanal").channel.id
    const name = interaction.options.get("isim_sablonu").value as string
    await SetServerSetting(interaction.guildId, 'memberSizeChannel', { name, channelId })
    interaction.editReply({ content: `<#${channelId}> kanalı üye sayısını gösterecek şekilde ayarlandı.` })
})
CreateChatCommand({
    name: "üye-sayısı-kanalı-kaldır",
    description: "Üye sayısı kanalını iptal eder."
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
    const memberSizeChannel = await GetServerSetting(interaction.guildId, 'memberSizeChannel')
    if (!memberSizeChannel) { interaction.editReply({ content: `Şu anda üye sayısını gösteren bir kanal bulunmamakta.` }); return }
    await SetServerSetting(interaction.guildId, 'memberSizeChannel', null)
    interaction.editReply({ content: `<#${memberSizeChannel.channelId}> kanalı artık üye sayısını göstermeyecek.` })
})
CreateChatCommand({
    name: "üye-sayısı-kanalı-göster",
    description: "Üye sayısı kanalını gösterir.",
}, async (interaction) => {
    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
    const memberSizeChannel = await GetServerSetting(interaction.guildId, 'memberSizeChannel')
    if (!memberSizeChannel) { interaction.editReply({ content: `Şu anda üye sayısını gösteren bir kanal bulunmamakta.` }); return }
    interaction.editReply({ content: `<#${memberSizeChannel.channelId}> kanalı üye sayısını gösteriyor.` })
})

try {
    ServerSettingsCache.forEach(async ({ guildId, memberSizeChannel: { channelId, name } }) => {
        try {
            if (!channelId) { return }
            const guild = await client.guilds.fetch(guildId)
            const channel = guild &&  await guild.channels.fetch(channelId)
            if (!channel) { return }
            channel.setName((name ? name : '').replace("{sayı}", guild.memberCount.toString()))
        } catch (error) {
            console.error(error)
        }
    })
} catch (error) {
    console.error(error)
}
CreateEvent("guildMemberAdd", async (member) => {
    const guild = member.guild
    const memberSizeChannel = await GetServerSetting(member.guild.id, 'memberSizeChannel')
    if (!memberSizeChannel) { return }
    const channel = guild && await guild.channels.fetch(memberSizeChannel.channelId)
    if (!channel) { return }
    channel.setName(memberSizeChannel.name.replace("{sayı}", guild.memberCount.toString()))
})
CreateEvent("guildMemberRemove", async (member) => {
    const guild = member.guild
    const memberSizeChannel = await GetServerSetting(member.guild.id, 'memberSizeChannel')
    if (!memberSizeChannel) { return }
    const channel = guild && await guild.channels.fetch(memberSizeChannel.channelId)
    if (!channel) { return }
    channel.setName(memberSizeChannel.name.replace("{sayı}", guild.memberCount.toString()))
})