import { ApplicationCommandOptionType, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ComponentType } from "discord.js";
import { model, Schema } from "mongoose";
import { client } from "../client.js";
import { GetServerSetting, SetServerSetting } from "./ServerSettings.js";
import { CreateButtonInteraction, CreateChatCommand, CreateEvent, CreateModalInteraction } from "./Interactor.js";

export const PrivateRoomModel = model("PrivateRoom", new Schema({
    messageId: String,
    name: {
        type: String,
        required: false
    },
    channelId: {
        type: String,
        required: false
    },
    userId: String,
    guildId: String,
}))

const RoomCreateModal = CreateModalInteraction({
    custom_id: "RoomCreateModal",
    title: "Oda Oluşturma Formu",
    components: [
        {
            components: [
                {
                    custom_id: "Name",
                    label: "Özel Oda İsmi (Takviyeciler İçin)",
                    placeholder: "Zorunlu değil.",
                    style: TextInputStyle.Short,
                    required: false,
                    max_length: 25,
                    min_length: 3,
                    type: ComponentType.TextInput
                }
            ],
            type: ComponentType.ActionRow
        },
    ]
}, async (interaction, data) => {
    try {
        await interaction.deferReply()
        const Name = interaction.fields.fields.get("Name").value
        const PrivateRoom = await PrivateRoomModel.findOne({ messageId: interaction.message.id })
        const guild = await client.guilds.fetch(PrivateRoom.guildId)
        const channel = await guild.channels.fetch(PrivateRoom.channelId)
        const member = await guild.members.fetch(interaction.user.id)
        const PrivateRoomChannel = await guild.channels.create({
            name: member.premiumSince ? Name : `${member.displayName}'in Özel Odası`,
            type: ChannelType.GuildVoice,
            parent: channel.parent.id,
            userLimit: data.get("state") == "public" ? undefined : 1,
        })
        await PrivateRoom.updateOne({ channelId: PrivateRoomChannel.id })
        await member.voice.setChannel(PrivateRoomChannel.id)
        await interaction.message.edit({
            content: 'Odanız için bir eylem seçin..',
            components: [
                new ActionRowBuilder<ButtonBuilder>({
                    components: [
                        new ButtonBuilder({
                            custom_id: "RoomBlackList",
                            label: "Kara Liste",
                            style: ButtonStyle.Secondary
                        }),
                        new ButtonBuilder({
                            custom_id: "ChangeRoomName",
                            label: "Oda İsmini Değiştir (Takviye Gereklidir)",
                            style: ButtonStyle.Primary
                        }),
                        new ButtonBuilder({
                            custom_id: "DeleteRoom",
                            label: "Odayı Sil",
                            style: ButtonStyle.Danger
                        })
                    ]
                })
            ]
        })
        await interaction.deleteReply()
    } catch (error) {
        console.error(error)
        interaction[interaction.replied || interaction.deferred ? 'editReply' : 'reply']({ ephemeral: interaction.replied || interaction.deferred ?  null : true , content: `Bir hata oluştu.` })
    }
})
//RoomCreateModal.setCustomId(RoomCreateModal.data.custom_id + '?state=public')

CreateChatCommand({
    name: "özel-oda-kanalı-ayarla",
    description: "Özel oda sistemi için kanalı ayarlar.",
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
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
    const privateRoomChannelId = await GetServerSetting(interaction.guild.id, 'privateRoomChannelId')
    if (!privateRoomChannelId) { interaction.editReply({  content: `Şu anda özel oda ayarlama kanalı bulunmamakta.` }); return }
    interaction.editReply({  content: `<#${privateRoomChannelId}> kanalı, şu anda bir özel oda ayarlama kanalı.` })
})

const CreateRoomButton = CreateButtonInteraction({
    custom_id: "CreateRoomButton",
    label: "Oda Oluştur",
    style: ButtonStyle.Primary
}, async (interaction) => {
    await interaction.deferReply()
    await interaction.message.edit({
        content: 'Oda oluşturacaksınız, eylem seçin..',
        components: [
            new ActionRowBuilder<ButtonBuilder>({
                components: [
                    CreatePublicRoomButton,
                    CreatePrivateRoomButton,
                    PendRoomToFirstStageButton
                ]
            })
        ]
    })
    await interaction.deleteReply()
})
const PendRoomToFirstStageButton = CreateButtonInteraction({
    custom_id: "PendRoomToFirstStageButton",
    label: "Geri Dön",
    style: ButtonStyle.Danger
}, async (interaction) => {
    await interaction.deferReply()
    await interaction.message.edit({
        content: 'Oda oluşturma kanalına girdiniz, eylem seçin..',
        components: [
            new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder({
                        custom_id: "CreateRoom",
                        label: "Oda Oluştur",
                        style: ButtonStyle.Primary
                    }),
                    new ButtonBuilder({
                        custom_id: "PendRoom",
                        label: "Odaya Giriş İzni İste",
                        style: ButtonStyle.Secondary
                    })
                ]
            })
        ]
    })
    await interaction.deleteReply()
})
const CreatePrivateRoomButton = CreateButtonInteraction({
    custom_id: "CreatePrivateRoomButton",
    label: "Özel Oda Oluştur",
    style: ButtonStyle.Secondary
}, async (interaction) => {
    interaction.showModal(RoomCreateModal)
})
const CreatePublicRoomButton = CreateButtonInteraction({
    custom_id: "CreatePublicRoomButton",
    label: "Herkese Açık Oda Oluştur (Sunucu Takviyesi Gerekir)",
    style: ButtonStyle.Primary
}, async (interaction) => {
    const PrivateRoom = await PrivateRoomModel.findOne({ messageId: interaction.message.id, userId: interaction.user.id })
    const guild = await client.guilds.fetch(PrivateRoom.guildId)
    const member = await guild.members.fetch(interaction.user.id)
    if (!member.premiumSince) { return }
    interaction.showModal(RoomCreateModal.setCustomId(RoomCreateModal.data.custom_id+"?public=true"))
})
const PendRoomButton = CreateButtonInteraction({
    custom_id: "PendRoomButton",
    label: "Odaya Giriş İzni İste",
    style: ButtonStyle.Secondary
}, async (interaction) => {
})

CreateEvent("voiceStateUpdate",  async (oldState, newState) => {
    if (oldState.channelId === newState.channelId) { return }
    const privateRoomChannelId = await GetServerSetting(newState.guild.id, 'privateRoomChannelId')
    if (!privateRoomChannelId) { return }

    const OldPrivateRoom = PrivateRoomModel.findOne()

    if (newState.channelId === privateRoomChannelId) {
        const message = await newState.member.user.send({
            content: `Oda oluşturma kanalındasınız, eylem seçin..`,
            components: [
                new ActionRowBuilder<ButtonBuilder>({
                    components: [
                        CreateRoomButton,
                        PendRoomButton
                    ]
                })
            ]
        })
        await PrivateRoomModel.create({ guildId: newState.guild.id, userId: newState.member.user.id, messageId: message.id })
    } else if (newState.channel) {
        const PrivateRoom = await PrivateRoomModel.findOne({ guildId: newState.guild.id, channelId: newState.channel.id })
        if (!PrivateRoom || PrivateRoom.userId !== newState.member.user.id) {
            const UserPrivateRoom = await PrivateRoomModel.findOneAndDelete({ guildId: newState.guild.id, userId: newState.member.user.id })
            if (!UserPrivateRoom) { return }
            const message = await newState.member.user.dmChannel.messages.fetch(UserPrivateRoom.messageId)
            if (!message) { return }
            await message.delete()
        } else {
            PrivateRoom
        }
    }
})