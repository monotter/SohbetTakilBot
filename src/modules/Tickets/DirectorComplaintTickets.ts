import { ModalBuilder, ButtonBuilder, ButtonStyle, ChannelType, TextChannel, ThreadAutoArchiveDuration, ActionRowBuilder, ModalActionRowComponentBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction, EmbedBuilder, ButtonInteraction, GuildMember, ThreadChannel } from "discord.js"
import { addInteraction } from "../../client.js"
import axios from "axios"
import { model, Schema } from "mongoose"
import { wait } from "../../functions/Wait.js"
import { DirectorRolesModel } from "../Roles/DirectorRoles.js"


export enum DirectorComplaintTicketStatus {
    OnGoing = 0,
    Closed = 1,
}
export const DirectorComplaintTicketModel = model("DirectorComplaintTicket", new Schema({
    guildId: String,
    threadId: String,
    creatorId: String,
    status: Number,
    reason: {
        type: String,
        required: false
    }
}))

const DirectorComplaintModal = new ModalBuilder({
    custom_id: "DirectorComplaintModal",
    title: "Şikayetini Direktör'e Bildirme Formu",
    components: [
        new ActionRowBuilder<ModalActionRowComponentBuilder>({
            components: [
                new TextInputBuilder({
                    custom_id: "RobloxUsername",
                    label: "Roblox kullanıcı adınız (yoksa boş bırakın)",
                    placeholder: "örn: Monotter (DisplayName yazmayın.)",
                    style: TextInputStyle.Short,
                    required: false,
                })
            ]
        }),
        new ActionRowBuilder<ModalActionRowComponentBuilder>({
            components: [
                new TextInputBuilder({
                    custom_id: "Complaint",
                    label: "Şikayetinizi yazın",
                    placeholder: "Uzun uzun açıklayın.",
                    style: TextInputStyle.Paragraph,
                    required: true,
                })
            ]
        }),
        new ActionRowBuilder<ModalActionRowComponentBuilder>({
            components: [
                new TextInputBuilder({
                    custom_id: "Reason",
                    label: "Neden şikayetini direktöre bildirmek istedin?",
                    placeholder: "Neden özellikle direktör?",
                    style: TextInputStyle.Paragraph,
                    required: false,
                })
            ]
        }),
        new ActionRowBuilder<ModalActionRowComponentBuilder>({
            components: [
                new TextInputBuilder({
                    custom_id: "Acknowledge",
                    label: "Farkındalık beyanı (aşağıdaki gibi yazın.)",
                    placeholder: "Geç cevap alabileceğimin farkındayım.",
                    style: TextInputStyle.Short,
                    required: true,
                })
            ]
        }),
    ]
})
const CloseDirectorComplaintModal = new ModalBuilder({
    custom_id: "CloseDirectorComplaintModal",
    title: "Şikayet Kapatma",
    components: [
        new ActionRowBuilder<ModalActionRowComponentBuilder>({
            components: [
                new TextInputBuilder({
                    custom_id: "Reason",
                    label: "Şikayeti neden kapatıyorsunuz?",
                    placeholder: "Açıklayın.",
                    style: TextInputStyle.Paragraph,
                    required: true,
                })
            ]
        })
    ]
})

addInteraction(async (interaction: ModalSubmitInteraction) => {
    try {
        if (!interaction.isModalSubmit()) { return }
        if (interaction.customId === "DirectorComplaintModal") {
            await interaction.reply({ ephemeral: true, content: "Direktör şikayetiniz oluşturuluyor.." })
            let RobloxData: { User?: { displayName: string, hasVerifiedBadge: boolean, id: number, name: string, requestedUsername: string }, HeadShotImageData?: { targetId: number, state: string, imageUrl: string }, AvatarBustImageData?: { targetId: number, state: string, imageUrl: string } } | undefined
            if (interaction.fields.fields.get("RobloxUsername").value) {
                RobloxData = {}
                const result = await axios.post("https://users.roblox.com/v1/usernames/users", { "usernames": [interaction.fields.fields.get("RobloxUsername").value], "excludeBannedUsers": true })
                RobloxData.User = result.data.data[0] as { displayName: string, hasVerifiedBadge: boolean, id: number, name: string, requestedUsername: string } | null
                if (!RobloxData.User) {
                    await interaction.reply({ ephemeral: true, content: "Girdiğiniz Roblox hesabı mevcut değil veya yasaklı olduğundan formunuz geçersizdir." })
                    return
                }
                RobloxData.HeadShotImageData = (await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${RobloxData.User.id}&size=420x420&format=Png&isCircular=false`)).data.data[0]
                RobloxData.AvatarBustImageData = (await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${RobloxData.User.id}&size=420x420&format=Png&isCircular=false`)).data.data[0]
            }
            const TicketThread = await (interaction.channel as TextChannel).threads.create({
                name: `[Direktör Şikayet] ${ interaction.user.tag }`,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                type: ChannelType.PrivateThread,
                reason: 'Direktör şikayet.',
            })
            await DirectorComplaintTicketModel.create({
                guildId: interaction.guild.id,
                threadId: TicketThread.id,
                creatorId: interaction.user.id,
                status: DirectorComplaintTicketStatus.OnGoing
            })
            await TicketThread.members.add(interaction.user, "Muhatap")
            const DirectorRoles = await DirectorRolesModel.find({ guildId: interaction.guildId })
            await Promise.all(DirectorRoles.map(async ({ roleId }) => {
                const roles = await interaction.guild.roles.fetch(roleId)
                return Promise.all(roles.members.map(async (member) => {
                    return TicketThread.members.add(member, "Muhatap")
                }))
            }))
            await TicketThread.members.add(interaction.user, "Muhatap")
            const Message = await TicketThread.send({
                content: "Direktör şikayet formunuz bu mesajın gömülü içeriğinde yer almaktadır, ekstradan bir şeyler eklemek isterseniz bu alt başlığa yazabilirsiniz, alt başlık 7 gün boyunca hiç bir şey yazılmadığı durumda otomatik olarak inaktif duruma gelir ve bu durumda alt başlığı bulabilmek isterseniz yukarıdaki alt başlıklar butonu üzerinden görüntüleyebilirsiniz, sorununuz çözüldüyse ve alt başlığı kapatmak isterseniz bu mesajdaki `Ticket'i Kapat` butonuna basabilirsiniz.",
                embeds: [
                    new EmbedBuilder({
                        color: 0x0099FF,
                        title: "Direktör Şikayet Formu",
                        author: RobloxData && {
                            name: `${ RobloxData.User.displayName } (@${RobloxData.User.name})`,
                            icon_url: RobloxData.HeadShotImageData.imageUrl,
                            url: `https://www.roblox.com/users/${RobloxData.User.id}/profile`
                        },
                        thumbnail: RobloxData && { url: RobloxData.AvatarBustImageData.imageUrl },
                        fields: RobloxData ? [
                            { name: 'Roblox kullanıcı adı', value: interaction.fields.fields.get("RobloxUsername").value },
                            { name: 'Şikayet', value: interaction.fields.fields.get("Complaint").value },
                            { name: 'Neden şikayetini direktöre bildirmek istedin?', value: interaction.fields.fields.get("Reason").value },
                            { name: 'Farkındalık beyanı', value: interaction.fields.fields.get("Acknowledge").value },
                        ] : [
                            { name: 'Şikayet', value: interaction.fields.fields.get("Complaint").value },
                            { name: 'Neden şikayetini direktöre bildirmek istedin?', value: interaction.fields.fields.get("Reason").value },
                            { name: 'Farkındalık beyanı', value: interaction.fields.fields.get("Acknowledge").value },
                        ],
                        footer: {
                            text: `${ interaction.user.tag } (${ interaction.user.id })`,
                            icon_url: interaction.user.avatarURL()
                        },
                    })
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>({
                        components: [
                            new ButtonBuilder({
                                custom_id: "CloseDirectorComplaint",
                                label: "Şikayeti Kapat",
                                style: ButtonStyle.Danger
                            }),
                        ]
                    })
                ]
            })
            await Message.pin()
            await interaction.editReply({ content: "Direktör şikayetiniz oluşturuldu." })
        } else if (interaction.customId === "CloseDirectorComplaintModal") {
            await interaction.reply({ ephemeral: true, content: 'Şikayet kapatılıyor..' })
            await wait(2000)
            const Reason = interaction.fields.fields.get("Reason").value
            const TicketThread = interaction.channel as ThreadChannel
            const ThreadMembers = await TicketThread.members.fetch()
            await Promise.all(ThreadMembers.map((member) => member.remove("Şikayet kapatıldı.")))
            const DirectorComplaintTicket = await DirectorComplaintTicketModel.findOne({ guildId: interaction.guildId, threadId: interaction.channel.id }) || { creatorId: 0 }
            if (DirectorComplaintTicket.creatorId !== interaction.user.id) {
                await TicketThread.send(`<@${interaction.user.id}> <@${ DirectorComplaintTicket.creatorId }>'in şikayetini, \`${Reason}\` sebebinden dolayı kapattı.`)
                try {
                    await interaction.guild.members.fetch()
                    await interaction.guild.members.cache.get(`${DirectorComplaintTicket.creatorId}`).user.send({ content: `Direktör şikayetiniz, \`${Reason}\` sebebinden dolayı kapatıldı.` })
                } catch (error) { }
            } else {
                await TicketThread.send(`<@${interaction.user.id}> şikayetini, \`${Reason}\` sebebinden dolayı kapattı.`)
                try {
                    await interaction.user.send({ content: `Direktör şikayetinizi, \`${Reason}\` sebebinden dolayı kapattınız.` })
                } catch (error) { }
            }
            await DirectorComplaintTicketModel.updateOne({ guildId: interaction.guildId, threadId: interaction.channel.id }, { $set: { reason: Reason, status: DirectorComplaintTicketStatus.Closed } })
            await interaction.deleteReply()
            TicketThread.setLocked(true)
            TicketThread.setArchived(true)
        }
    } catch (error) {
        console.error(error)
        interaction[interaction.replied ? 'editReply' : 'reply']({ ephemeral: interaction.replied ?  null : true , content: `Bir hata oluştu.` })
    }
})

addInteraction(async (interaction: ButtonInteraction) => {
    try {
        if (!interaction.isButton()) { return }
        if (interaction.customId === "DirectorComplaint") {
            if (await DirectorComplaintTicketModel.findOne({ guildId: interaction.guildId, creatorId: interaction.user.id, status: DirectorComplaintTicketStatus.OnGoing })) { interaction.reply({ ephemeral: true, content: `Zaten hali hazırda devam eden bir şikayetiniz var.` }); return }
            await interaction.showModal(DirectorComplaintModal)
        } else if (interaction.customId === "CloseDirectorComplaint") {
            const DirectorComplaintTicket = await DirectorComplaintTicketModel.findOne({ guildId: interaction.guildId, threadId: interaction.channelId })
            if (!(DirectorComplaintTicket.creatorId === interaction.user.id || await DirectorRolesModel.findOne({ roleId: { $in: (interaction.member as GuildMember).roles.cache.map(({ id }) => id) } }))) {
                await interaction.reply({ ephemeral: true, content: `Bu Şikayeti kapatabilmeniz için direktör veya şikayet sahibi olmanız gerekiyor.` }); return
            }
            await interaction.showModal(CloseDirectorComplaintModal)
        }
    } catch (error) {
        console.error(error)
        interaction[interaction.replied ? 'editReply' : 'reply']({ ephemeral: interaction.replied ?  null : true , content: `Bir hata oluştu.` })
    }
})