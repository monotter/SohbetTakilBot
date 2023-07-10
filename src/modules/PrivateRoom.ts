import { ApplicationCommandOptionType, ChannelType, VoiceChannel, PermissionFlagsBits } from "discord.js";
import { model, Schema } from "mongoose";
import { GetServerSetting, SetServerSetting } from "./ServerSettings.js";
import { CreateChatCommand, CreateEvent } from "./Interactor.js";
import { client } from "../client.js";

export const PrivateRoomModel = model("PrivateRoom", new Schema({
    messageId: String,
    channelId: {
        type: String,
        required: false
    },
    userId: String,
    guildId: String,
}))

const ChannelNamesCache = new Map<string, Map<string, string>>()
const CachedDocuments = await PrivateRoomModel.find()
CachedDocuments.forEach(async (Document) => {
    let ChannelNames = ChannelNamesCache.get(Document.guildId)
    if (!ChannelNames) { ChannelNames = new Map(); ChannelNamesCache.set(Document.guildId, ChannelNames) }
    const Channel = Document.channelId && (await (await client.guilds.fetch(Document.guildId))?.channels.fetch(Document.channelId) as VoiceChannel)
    if (!Channel) { await Document.deleteOne(); return }
    ChannelNames.set(Channel.name, Document.channelId)
})


CreateEvent("voiceStateUpdate", async (oldState, newState) => {
    if (oldState.channelId === newState.channelId) { return }
    const privateRoomChannelId = await GetServerSetting(newState.guild.id, 'privateRoomChannelId')
    if (!privateRoomChannelId) { return }
    if (newState.channelId === privateRoomChannelId) {
        const PrivateRoomDocument = await PrivateRoomModel.findOne({ guildId: newState.guild.id, userId: newState.member.user.id })
        let PrivateRoomChannel: VoiceChannel
        if (PrivateRoomDocument) {
            PrivateRoomChannel = await newState.guild.channels.cache.get(PrivateRoomDocument.channelId) as VoiceChannel
        }
        if (!PrivateRoomChannel) {
            await PrivateRoomModel.deleteMany({ guildId: newState.guild.id, userId: newState.member.user.id })
            PrivateRoomChannel = await newState.guild.channels.create({
                name: `Özel #${newState.member.displayName}`,
                type: ChannelType.GuildVoice,
                parent: newState.channel.parent.id,
                userLimit: 1,
                permissionOverwrites: [
                    {
                        id: newState.member.user.id,
                        allow: ["ManageChannels", "Speak", "PrioritySpeaker", "MoveMembers"]
                    }
                ]
            })
            let ChannelNames = ChannelNamesCache.get(newState.guild.id)
            if (!ChannelNames) { ChannelNames = new Map(); ChannelNamesCache.set(newState.guild.id, ChannelNames) }
            ChannelNames.set(PrivateRoomChannel.name, PrivateRoomChannel.id)
            await PrivateRoomModel.create({ guildId: newState.guild.id, userId: newState.member.user.id, channelId: PrivateRoomChannel.id })
        }
        newState.member.voice.setChannel(PrivateRoomChannel.id)
    } else if (oldState.channel) {
        const PrivateRoomDocument = await PrivateRoomModel.findOne({ guildId: newState.guild.id, channelId: oldState.channelId })
        const PrivateRoomChannel = PrivateRoomDocument && await newState.guild.channels.cache.get(PrivateRoomDocument.channelId) as VoiceChannel
        if (PrivateRoomChannel && PrivateRoomChannel.members.size <= 0) {
            let ChannelNames = ChannelNamesCache.get(newState.guild.id)
            if (!ChannelNames) { ChannelNames = new Map(); ChannelNamesCache.set(newState.guild.id, ChannelNames) }
            ChannelNames.delete(PrivateRoomChannel.name)
            if (ChannelNames.size <= 0) { ChannelNamesCache.delete(newState.guild.id) }
            await PrivateRoomChannel.delete()
            await PrivateRoomDocument.deleteOne()
        }
    }
})



CreateChatCommand({
    name: "özel-oda-gir",
    description: "Özel odaya giriş izni ister",
    options: [
        { name: "kanal", type: ApplicationCommandOptionType.String, autocomplete: true, description: "Özel oda kanalı", required: true }
    ],
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    const focusedValue = interaction.options.get("kanal").value as string || ""
    let ChannelNames = ChannelNamesCache.get(interaction.guild.id)
    if (!ChannelNames) { ChannelNames = new Map(); ChannelNamesCache.set(interaction.guild.id, ChannelNames) }
    const choices = Array.from(ChannelNames).map(([name]) => name)
    const filtered = focusedValue && choices.filter(choice => choice.match(focusedValue))[0];
    if (!filtered) { interaction.editReply({ content: 'Oda bulunamadı..' }); return }
    const PrivateRoomDocument = await PrivateRoomModel.findOne({ guildId: interaction.guildId, channelId: ChannelNames.get(filtered) })
    if (!PrivateRoomDocument) { interaction.editReply({ content: 'Hatalı oda..' }); return }
    if (PrivateRoomDocument.userId === interaction.user.id) { interaction.editReply({ content: 'Kendi odanıza giriş isteği atamazsınız!' }); return }
    const PrivateRoomChannel = await interaction.guild.channels.fetch(ChannelNames.get(filtered)) as VoiceChannel
    if (!PrivateRoomChannel) { interaction.editReply({ content: 'Oda bulunamadı..' }); return }
    // PrivateRoomChannel.send()
    interaction.editReply({ content: filtered ? `Found: ${filtered}` : `Cannot Found` })
}, async (interaction) => {
    const focusedValue = interaction.options.getFocused();
    let ChannelNames = ChannelNamesCache.get(interaction.guild.id)
    if (!ChannelNames) { ChannelNames = new Map(); ChannelNamesCache.set(interaction.guild.id, ChannelNames) }
    const choices = Array.from(ChannelNames).map(([name]) => name)
    const filtered = choices.filter(choice => choice.match(focusedValue));
    await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })))
})

CreateChatCommand({
    name: "özel-oda-kanalı-ayarla",
    description: "Özel oda sistemi için kanalı ayarlar.",
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    options: [
        { name: "kanal", type: ApplicationCommandOptionType.Channel, description: "Özel oda kanalı", required: true }
    ],
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
    const channel = interaction.options.get("kanal").channel

    await SetServerSetting(interaction.guild.id, 'privateRoomChannelId', channel.id)
    interaction.editReply({ content: `Özel oda ayarlama kanalı, <#${channel.id}> olacak şekilde ayarlandı.` })
})
CreateChatCommand({
    name: "özel-oda-kanalı-kaldır",
    description: "Özel oda kanalını iptal eder.",
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({ content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
    const privateRoomChannelId = await GetServerSetting(interaction.guild.id, 'privateRoomChannelId')
    if (!privateRoomChannelId) { interaction.editReply({  content: `Şu anda özel oda ayarlama kanalı bulunmamakta.` }); return }
    await SetServerSetting(interaction.guild.id, 'privateRoomChannelId', null)
    interaction.editReply({ content: `Artık <#${privateRoomChannelId}> kanalı, özel oda ayarlama kanalı değil.` })
})
CreateChatCommand({
    name: "özel-oda-kanalı-göster",
    description: "Özel oda kanalını gösterir.",
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
    const privateRoomChannelId = await GetServerSetting(interaction.guild.id, 'privateRoomChannelId')
    if (!privateRoomChannelId) { interaction.editReply({  content: `Şu anda özel oda ayarlama kanalı bulunmamakta.` }); return }
    interaction.editReply({ content: `<#${privateRoomChannelId}> kanalı, şu anda bir özel oda ayarlama kanalı.` })
})