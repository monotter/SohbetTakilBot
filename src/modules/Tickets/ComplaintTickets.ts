import { ModalBuilder, ButtonBuilder, ButtonStyle, ChannelType, TextChannel, ThreadAutoArchiveDuration, ActionRowBuilder, ModalActionRowComponentBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction, EmbedBuilder, ButtonInteraction, GuildMember, ThreadChannel } from "discord.js"
import { addInteraction } from "../../client.js"
import axios from "axios"
import { model, Schema } from "mongoose"
import { StaffRolesModel } from "../Roles/StaffRoles.js"
import { wait } from "../../functions/Wait.js"

export enum ComplaintTicketStatus {
    OnGoing = 0,
    Closed = 1,
    Cancelled = 2,
    WaitingToBeClaimed = 3
}
export const ComplaintTicketModel = model("ComplaintTicket", new Schema({
    guildId: String,
    threadId: String,
    creatorId: String,
    messageId: {
        type: String,
        required: false
    },
    status: Number,
    reason: {
        type: String,
        required: false
    }
}))
const ComplaintModal = new ModalBuilder({
    custom_id: "ComplaintModal",
    title: "Şikayet Bildirme Formu",
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
        })
    ]
})
const CloseComplaintModal = new ModalBuilder({
    custom_id: "CloseComplaintModal",
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
const CancelComplaintModal = new ModalBuilder({
    custom_id: "CancelComplaintModal",
    title: "Şikayet İptal Etme",
    components: [
        new ActionRowBuilder<ModalActionRowComponentBuilder>({
            components: [
                new TextInputBuilder({
                    custom_id: "Reason",
                    label: "Şikayeti neden iptal ediyorsunuz?",
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
        if (interaction.customId === "ComplaintModal") {
            await interaction.deferReply({ ephemeral: true })
            await interaction.editReply({  content: 'Şikayetiniz oluşturuluyor..' })
            let RobloxData: { User?: { displayName: string, hasVerifiedBadge: boolean, id: number, name: string, requestedUsername: string }, HeadShotImageData?: { targetId: number, state: string, imageUrl: string }, AvatarBustImageData?: { targetId: number, state: string, imageUrl: string } } | undefined
            if (interaction.fields.fields.get("RobloxUsername").value) {
                RobloxData = {}
                const result = await axios.post("https://users.roblox.com/v1/usernames/users", { "usernames": [interaction.fields.fields.get("RobloxUsername").value], "excludeBannedUsers": true })
                RobloxData.User = result.data.data[0] as { displayName: string, hasVerifiedBadge: boolean, id: number, name: string, requestedUsername: string } | null
                if (!RobloxData.User) {
                    await interaction.editReply({  content: "Girdiğiniz Roblox hesabı mevcut değil veya yasaklı olduğundan formunuz geçersizdir." })
                    return
                }
                RobloxData.HeadShotImageData = (await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${RobloxData.User.id}&size=420x420&format=Png&isCircular=false`)).data.data[0]
                RobloxData.AvatarBustImageData = (await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${RobloxData.User.id}&size=420x420&format=Png&isCircular=false`)).data.data[0]
            }
            const TicketThread = await (interaction.channel as TextChannel).threads.create({
                name: `[Şikayet] ${ interaction.user.tag }`,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                type: ChannelType.PrivateThread,
                reason: 'Şikayet.',
            })
            await TicketThread.members.add(interaction.user, "Muhatap")
            const StaffRoles = await StaffRolesModel.find({ guildId: interaction.guildId })
            await Promise.all(StaffRoles.map(async ({ roleId }) => {
                const roles = await interaction.guild.roles.fetch(roleId)
                return Promise.all(roles.members.map(async (member) => {
                    return TicketThread.members.add(member, "Muhatap")
                }))
            }))
            await TicketThread.members.add(interaction.user, "Muhatap")
            const Message = await TicketThread.send({
                content: "Şikayet formunuz bu mesajın gömülü içeriğinde yer almaktadır, ekstradan bir şeyler eklemek isterseniz bir yetkili şikayetinizi devraldığında bu alt başlığa yazabilirsiniz, alt başlık 3 gün boyunca hiç bir şey yazılmadığı durumda otomatik olarak inaktif duruma gelir ve bu durumda alt başlığı bulabilmek isterseniz yukarıdaki alt başlıklar butonu üzerinden görüntüleyebilirsiniz, sorununuz çözüldüyse ve alt başlığı kapatmak isterseniz bu mesajın butonları üzerindeki `Şikayeti Kapat` butonuna basabilirsiniz.",
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
                        ] : [
                            { name: 'Şikayet', value: interaction.fields.fields.get("Complaint").value },
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
                                custom_id: "HandleComplaint",
                                label: "Şikayeti Devral",
                                style: ButtonStyle.Success
                            }),
                            new ButtonBuilder({
                                custom_id: "CancelComplaint",
                                label: "Şikayeti İptal Et",
                                style: ButtonStyle.Danger
                            }),
                        ]
                    })
                ]
            })
            await Message.pin()
            await ComplaintTicketModel.create({
                guildId: interaction.guild.id,
                threadId: TicketThread.id,
                creatorId: interaction.user.id,
                status: ComplaintTicketStatus.WaitingToBeClaimed,
                messageId: Message.id
            })
            await interaction.editReply({ content: "Şikayetiniz oluşturuldu." })
        } else if (interaction.customId === "CancelComplaintModal") {
            await interaction.deferReply({ ephemeral: true })
            await interaction.editReply({  content: 'Başvurunuz iptal ediliyor..' })
            await wait(2000)
            const Reason = interaction.fields.fields.get("Reason").value
            const TicketThread = interaction.channel as ThreadChannel
            const ThreadMembers = await TicketThread.members.fetch()
            await Promise.all(ThreadMembers.map((member) => member.remove("Başvurunuz kapatıldı.")))
            await TicketThread.send(`<@${interaction.user.id}> başvurusunu, \`${Reason}\` sebebinden dolayı iptal etti.`)
            try {
                await interaction.user.send({ content: `Yetkili başvurunuzu, \`${Reason}\` sebebinden dolayı iptal ettiniz.` })
            } catch (error) { }
            await ComplaintTicketModel.updateOne({ guildId: interaction.guildId, threadId: interaction.channel.id }, { $set: { reason: Reason, status: ComplaintTicketStatus.Cancelled } })
            await interaction.deleteReply()
            TicketThread.setLocked(true)
            TicketThread.setArchived(true)
        } else if (interaction.customId === "CloseComplaintModal") {
            await interaction.deferReply({ ephemeral: true })
            await interaction.editReply({  content: 'Şikayet kapatılıyor..' })
            await wait(2000)
            const Reason = interaction.fields.fields.get("Reason").value
            const TicketThread = interaction.channel as ThreadChannel
            const ThreadMembers = await TicketThread.members.fetch()
            await Promise.all(ThreadMembers.map((member) => member.remove("Şikayet kapatıldı.")))
            const ComplaintTicket = await ComplaintTicketModel.findOne({ guildId: interaction.guildId, threadId: interaction.channel.id }) || { creatorId: 0 }
            if (ComplaintTicket.creatorId !== interaction.user.id) {
                await TicketThread.send(`<@${interaction.user.id}> <@${ ComplaintTicket.creatorId }>'in şikayetini, \`${Reason}\` sebebinden dolayı kapattı.`)
                try {
                    await interaction.guild.members.fetch()
                    await interaction.guild.members.cache.get(`${ComplaintTicket.creatorId}`).user.send({ content: `Şikayetiniz, \`${Reason}\` sebebinden dolayı kapatıldı.` })
                } catch (error) { }
            } else {
                await TicketThread.send(`<@${interaction.user.id}> şikayetini, \`${Reason}\` sebebinden dolayı kapattı.`)
                try {
                    await interaction.user.send({ content: `Şikayetinizi, \`${Reason}\` sebebinden dolayı kapattınız.` })
                } catch (error) { }
            }
            await ComplaintTicketModel.updateOne({ guildId: interaction.guildId, threadId: interaction.channel.id }, { $set: { reason: Reason, status: ComplaintTicketStatus.Closed } })
            await interaction.deleteReply()
            TicketThread.setLocked(true)
            TicketThread.setArchived(true)
        }
    } catch (error) {
        console.error(error)
        interaction[interaction.replied || interaction.deferred ? 'editReply' : 'reply']({ ephemeral: interaction.replied || interaction.deferred ?  null : true , content: `Bir hata oluştu.` })
    }
})

addInteraction(async (interaction: ButtonInteraction) => {
    try {
        if (!interaction.isButton()) { return }
        if (interaction.customId === "Complaint") {
            if (await ComplaintTicketModel.findOne({ guildId: interaction.guildId, creatorId: interaction.user.id, $or: [{ status: ComplaintTicketStatus.WaitingToBeClaimed }, { status: ComplaintTicketStatus.OnGoing }] })) { interaction.editReply({  content: `Zaten hali hazırda devam eden bir şikayetiniz var.` }); return }
            await interaction.showModal(ComplaintModal)
        } else if (interaction.customId === "HandleComplaint") {
            await interaction.deferReply({ ephemeral: true })
            await interaction.editReply({  content: `Şikayet devralınıyor..` })
            if (!await StaffRolesModel.findOne({ roleId: { $in: (interaction.member as GuildMember).roles.cache.map(({ id }) => id) } })) {
                await interaction.editReply({  content: `Bu eylem için bir yetkili rolüne ihtiyacınız var.` }); return
            }
            const TicketThread = interaction.channel as ThreadChannel
            const ComplaintTicket = await ComplaintTicketModel.findOneAndUpdate({ guildId: interaction.guildId, threadId: TicketThread.id }, { $set: { status: ComplaintTicketStatus.OnGoing } })
            const ThreadMembers = await TicketThread.members.fetch()
            await Promise.all(ThreadMembers.filter(({ guildMember }) => !(guildMember.id === ComplaintTicket.id || guildMember.id === interaction.user.id)).map((member) => member.remove()))
            const Message = await TicketThread.messages.fetch(ComplaintTicket.messageId)
            if (Message) {
                Message.edit({
                    components: [
                        new ActionRowBuilder<ButtonBuilder>({
                            components: [
                                new ButtonBuilder({
                                    custom_id: "CloseComplaint",
                                    label: "Şikayeti Kapat",
                                    style: ButtonStyle.Danger
                                })
                            ]
                        })
                    ]
                })
            }
            await interaction.deleteReply()
            await TicketThread.send(`<@${interaction.user.id}>, şikayeti devraldı.`)
        } else if (interaction.customId === "CloseComplaint") {
            const ComplaintTicket = await ComplaintTicketModel.findOne({ guildId: interaction.guildId, threadId: interaction.channel.id })
            if (!(ComplaintTicket.creatorId === interaction.user.id || await StaffRolesModel.findOne({ roleId: { $in: (interaction.member as GuildMember).roles.cache.map(({ id }) => id) } }))) {
                await interaction.reply({ ephemeral: true, content: `Bu Şikayeti kapatabilmeniz için yetkili veya şikayet sahibi olmanız gerekiyor.` }); return
            }
            await interaction.showModal(CloseComplaintModal)
        } else if (interaction.customId === "CancelComplaint") {
            if (!await ComplaintTicketModel.findOne({ guildId: interaction.guildId, creatorId: interaction.user.id, threadId: interaction.channel.id })) { interaction.reply({ ephemeral: true, content: `Başvuruyu sadece sahibi iptal edebilir.` }); return }
            await interaction.showModal(CancelComplaintModal)
        }
    } catch (error) {
        console.error(error)
        interaction[interaction.replied || interaction.deferred ? 'editReply' : 'reply']({ ephemeral: interaction.replied || interaction.deferred ?  null : true , content: `Bir hata oluştu.` })
    }
})