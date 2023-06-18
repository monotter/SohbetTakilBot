import { ModalBuilder, ButtonBuilder, ButtonStyle, ChannelType, GuildMember, TextChannel, ThreadChannel, ThreadAutoArchiveDuration, ActionRowBuilder, ModalActionRowComponentBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction, EmbedBuilder, ButtonInteraction, Message } from "discord.js"
import { addInteraction } from "../../client.js"
import axios from "axios"
import { model, Schema } from "mongoose"
import { ManagerRolesModel } from "../Roles/ManagerRoles.js"
import { wait } from "../../functions/Wait.js"
import { StaffApplicationEnabledModel } from "./Tickets.js"
import { StaffRolesModel } from "../Roles/StaffRoles.js"

export enum StaffApplicationTicketStatus {
    OnGoing = 0,
    Cancelled = 1,
    Accepted = 2,
    Refused = 3,
}
export const StaffApplicationTicketModel = model("StaffApplicationTicket", new Schema({
    guildId: String,
    threadId: String,
    creatorId: String,
    status: Number,
    reason: {
        type: String,
        required: false
    }
}))

const StaffApplicationModal = new ModalBuilder({
    custom_id: "StaffApplicationModal",
    title: "Yetkili Başvuru Formu",
    components: [
        new ActionRowBuilder<ModalActionRowComponentBuilder>({
            components: [
                new TextInputBuilder({
                    custom_id: "RobloxUsername",
                    label: "Roblox kullanıcı adınız?",
                    placeholder: "örn: Monotter (DisplayName yazmayın.)",
                    style: TextInputStyle.Short,
                    required: true,
                })
            ]
        }),
        new ActionRowBuilder<ModalActionRowComponentBuilder>({
            components: [
                new TextInputBuilder({
                    custom_id: "Age",
                    label: "Yaşınız? (sayı girin.)",
                    placeholder: "örn: 20",
                    style: TextInputStyle.Short,
                    required: true,
                })
            ]
        }),
        new ActionRowBuilder<ModalActionRowComponentBuilder>({
            components: [
                new TextInputBuilder({
                    custom_id: "Devices",
                    label: "Hangi platformlardan girebilirsiniz?",
                    placeholder: "örn: Laptop, PC, Tablet, Telefon",
                    style: TextInputStyle.Short,
                    required: true,
                })
            ]
        }),
        new ActionRowBuilder<ModalActionRowComponentBuilder>({
            components: [
                new TextInputBuilder({
                    custom_id: "Reason",
                    label: "Neden yetkili olmak istiyorsunuz?",
                    placeholder: "Uzun uzun açıklayın.",
                    style: TextInputStyle.Paragraph,
                    required: true,
                })
            ]
        }),
        new ActionRowBuilder<ModalActionRowComponentBuilder>({
            components: [
                new TextInputBuilder({
                    custom_id: "Acknowledge",
                    label: "Farkındalık beyanı (aşağıdaki gibi yazın.)",
                    placeholder: "Yetkim herhangi bir sebebden alınabilir.",
                    style: TextInputStyle.Short,
                    required: true,
                })
            ]
        }),
    ]
})
const CancelStaffApplicationModal = new ModalBuilder({
    custom_id: "CancelStaffApplicationModal",
    title: "Yetkili Başvuru İptali",
    components: [
        new ActionRowBuilder<ModalActionRowComponentBuilder>({
            components: [
                new TextInputBuilder({
                    custom_id: "Reason",
                    label: "Başvuruyu neden iptal ediyorsunuz?",
                    placeholder: "Açıklayın. (zorunlu değil)",
                    style: TextInputStyle.Paragraph,
                    required: false,
                })
            ]
        })
    ]
})
const RefuseStaffApplicationModal = new ModalBuilder({
    custom_id: "RefuseStaffApplicationModal",
    title: "Yetkili Başvuru Reddetme",
    components: [
        new ActionRowBuilder<ModalActionRowComponentBuilder>({
            components: [
                new TextInputBuilder({
                    custom_id: "Reason",
                    label: "Başvuruyu neden reddediyorsunuz?",
                    placeholder: "Buraya yazdığınız şeyler, başvuru sahibine iletilir.",
                    style: TextInputStyle.Paragraph,
                    required: true,
                })
            ]
        })
    ]
})
const AcceptStaffApplicationModal = new ModalBuilder({
    custom_id: "AcceptStaffApplicationModal",
    title: "Yetkili Başvuru Onaylama",
    components: [
        new ActionRowBuilder<ModalActionRowComponentBuilder>({
            components: [
                new TextInputBuilder({
                    custom_id: "Reason",
                    label: "Başvuruyu neden onaylıyorsunuz?",
                    placeholder: "Buraya yazdığınız şeyler, başvuru sahibine iletilmez.",
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
        if (interaction.customId === "StaffApplicationModal") {
            await interaction.deferReply({ ephemeral: true })
            await interaction.editReply({  content: "Başvuru talebiniz oluşturuluyor.." })
            const result = await axios.post("https://users.roblox.com/v1/usernames/users", { "usernames": [interaction.fields.fields.get("RobloxUsername").value], "excludeBannedUsers": true })
            const User = result.data.data[0] as { displayName: string, hasVerifiedBadge: boolean, id: number, name: string, requestedUsername: string } | null
            if (!User) {
                await interaction.editReply({  content: "Girdiğiniz Roblox hesabı mevcut değil veya yasaklı olduğundan formunuz geçersizdir." })
                return
            }
            const HeadShotImageData = (await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${User.id}&size=420x420&format=Png&isCircular=false`)).data.data[0] as { targetId: number, state: string, imageUrl: string }
            const AvatarBustImageData = (await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${User.id}&size=420x420&format=Png&isCircular=false`)).data.data[0] as { targetId: number, state: string, imageUrl: string }
            const TicketThread = await (interaction.channel as TextChannel).threads.create({
                name: `[Yetkili Başvuru] ${ interaction.user.tag }`,
                autoArchiveDuration: ThreadAutoArchiveDuration.ThreeDays,
                type: ChannelType.PrivateThread,
                reason: 'Yetkili başvurusu.',
            })
            await StaffApplicationTicketModel.create({
                guildId: interaction.guild.id,
                threadId: TicketThread.id,
                creatorId: interaction.user.id,
                status: StaffApplicationTicketStatus.OnGoing
            })
            await TicketThread.setInvitable(false, "Yetkili başvurusunda 3. bir tarafa gerek yoktur.")
            await TicketThread.members.add(interaction.user, "Muhatap")
            const ManagerRoles = await ManagerRolesModel.find({ guildId: interaction.guildId })
            await Promise.all(ManagerRoles.map(async ({ roleId }) => {
                const roles = await interaction.guild.roles.fetch(roleId)
                return Promise.all(roles.members.map(async (member) => {
                    return TicketThread.members.add(member, "Muhatap")
                }))
            }))
            const Message = await TicketThread.send({
                content: "Yetkili başvuru formunuz bu mesajın gömülü içeriğinde yer almaktadır, ekstradan bir şeyler eklemek isterseniz bu alt başlığa yazabilirsiniz, alt başlık 3 gün boyunca hiç bir şey yazılmadığı durumda otomatik olarak inaktif duruma gelir ve bu durumda alt başlığı bulabilmek isterseniz yukarıdaki alt başlıklar butonu üzerinden görüntüleyebilirsiniz, başvurunuzu iptal etmek isterseniz bu mesaj üzerindeki `Başvuruyu İptal Et` butonuna basabilirsiniz.",
                embeds: [
                    new EmbedBuilder({
                        color: 0x0099FF,
                        title: "Yetkili Başvuru Formu",
                        author: {
                            name: `${ User.displayName } (@${User.name})`,
                            icon_url: HeadShotImageData.imageUrl,
                            url: `https://www.roblox.com/users/${User.id}/profile`
                        },
                        thumbnail: { url: AvatarBustImageData.imageUrl },
                        fields: [
                            { name: 'Roblox kullanıcı adı', value: interaction.fields.fields.get("RobloxUsername").value },
                            { name: 'Yaş', value: interaction.fields.fields.get("Age").value },
                            { name: 'Platformlar', value: interaction.fields.fields.get("Devices").value },
                            { name: 'Yetkili olmayı isteme nedeni', value: interaction.fields.fields.get("Reason").value },
                            { name: 'Farkındalık beyanı', value: interaction.fields.fields.get("Acknowledge").value },
                        ],
                        footer: {
                            text: `${ interaction.user.tag } (${ interaction.user.id })`,
                            icon_url: interaction.user.avatarURL()
                        },
                    }),
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>({
                        components: [
                            new ButtonBuilder({
                                custom_id: "CancelStaffApplication",
                                label: "Başvuruyu İptal Et",
                                style: ButtonStyle.Danger
                            }),
                            new ButtonBuilder({
                                custom_id: "RefuseStaffApplication",
                                label: "Başvuruyu Redded",
                                style: ButtonStyle.Danger
                            }),
                            new ButtonBuilder({
                                custom_id: "AcceptStaffApplication",
                                label: "Başvuruyu Onayla",
                                style: ButtonStyle.Success
                            }),
                        ]
                    })
                ]
            })
            await Message.pin()
            await interaction.editReply({ content: "Başvuru talebiniz oluşturuldu." })
        } else if (interaction.customId === "CancelStaffApplicationModal") {
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
            await StaffApplicationTicketModel.updateOne({ guildId: interaction.guildId, threadId: interaction.channel.id }, { $set: { reason: Reason, status: StaffApplicationTicketStatus.Cancelled } })
            await interaction.deleteReply()
            TicketThread.setLocked(true)
            TicketThread.setArchived(true)
        } else if (interaction.customId === "RefuseStaffApplicationModal") {
            await interaction.deferReply({ ephemeral: true })
            await interaction.editReply({  content: 'Başvuru reddediliyor..' })
            await wait(2000)
            const Reason = interaction.fields.fields.get("Reason").value
            const TicketThread = interaction.channel as ThreadChannel
            const ThreadMembers = await TicketThread.members.fetch()
            await Promise.all(ThreadMembers.map((member) => member.remove("Başvuru kapatıldı.")))
            const StaffApplication = await StaffApplicationTicketModel.findOne({ guildId: interaction.guildId, threadId: interaction.channel.id }) || { creatorId: 0 }
            await TicketThread.send(`<@${interaction.user.id}> <@${(StaffApplication.creatorId)}>'in başvurusunu, \`${Reason}\` sebebinden dolayı reddetti.`)
            try {
                await interaction.guild.members.fetch()
                await interaction.guild.members.cache.get(`${StaffApplication.creatorId}`).user.send({ content: `Yetkili başvurunuz, \`${Reason}\` sebebinden dolayı reddedildi.` })
            } catch (error) { }
            await StaffApplicationTicketModel.updateOne({ guildId: interaction.guildId, threadId: interaction.channel.id }, { $set: { reason: Reason, status: StaffApplicationTicketStatus.Refused } })
            await interaction.deleteReply()
            TicketThread.setLocked(true)
            TicketThread.setArchived(true)
        } else if (interaction.customId === "AcceptStaffApplicationModal") {
            await interaction.deferReply({ ephemeral: true })
            await interaction.editReply({  content: 'Başvuru onaylanıyor..' })
            await wait(2000)
            const Reason = interaction.fields.fields.get("Reason").value
            const TicketThread = interaction.channel as ThreadChannel
            const ThreadMembers = await TicketThread.members.fetch()
            await Promise.all(ThreadMembers.map((member) => member.remove("Başvuru kapatıldı.")))
            const StaffApplication = await StaffApplicationTicketModel.findOne({ guildId: interaction.guildId, threadId: interaction.channel.id })
            await TicketThread.send(`<@${interaction.user.id}> <@${(StaffApplication ? StaffApplication.creatorId : 0)}>'in başvurusunu, \`${Reason}\` sebebinden dolayı onayladı.`)
            try {
                await interaction.guild.members.fetch()
                await interaction.guild.members.cache.get(`${StaffApplication.creatorId}`).user.send({ content: `Yetkili başvurunuz onaylandı.` })
            } catch (error) { }
            await StaffApplicationTicketModel.updateOne({ guildId: interaction.guildId, threadId: interaction.channel.id }, { $set: { reason: Reason, status: StaffApplicationTicketStatus.Accepted } })
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
        if (interaction.customId === "StaffApplication") {
            if (await StaffApplicationTicketModel.findOne({ guildId: interaction.guildId, creatorId: interaction.user.id, status: StaffApplicationTicketStatus.OnGoing })) { interaction.reply({ ephemeral: true, content: `Zaten hali hazırda devam eden bir başvurunuz var.` }); return }
            if (!await StaffApplicationEnabledModel.findOne({ guildId: interaction.guildId })) { interaction.reply({ ephemeral: true, content: `Yetkili başvuruları kapalı.` }); return }
            if (await StaffRolesModel.findOne({ roleId: { $in: (interaction.member as GuildMember).roles.cache.map(({ id }) => id) } })) {
                await interaction.reply({ ephemeral: true, content: `Zaten bir yetkili rolüne sahip olduğunuz için tekrar başvuru yapamazsınız.` }); return
            }
            await interaction.showModal(StaffApplicationModal)
        } else if (interaction.customId === "CancelStaffApplication") {
            if (!await StaffApplicationTicketModel.findOne({ guildId: interaction.guildId, creatorId: interaction.user.id, threadId: interaction.channel.id })) { interaction.reply({ ephemeral: true, content: `Başvuruyu sadece sahibi iptal edebilir.` }); return }
            await interaction.showModal(CancelStaffApplicationModal)
        } else if (interaction.customId === "RefuseStaffApplication") {
            if (!await ManagerRolesModel.findOne({ roleId: { $in: (interaction.member as GuildMember).roles.cache.map(({ id }) => id) } })) {
                await interaction.reply({ ephemeral: true, content: `Bu eylem için bir denetleyici rolüne ihtiyacınız var.` }); return
            }
            await interaction.showModal(RefuseStaffApplicationModal)
        } else if (interaction.customId === "AcceptStaffApplication") {
            if (!await ManagerRolesModel.findOne({ roleId: { $in: (interaction.member as GuildMember).roles.cache.map(({ id }) => id) } })) {
                await interaction.reply({ ephemeral: true, content: `Bu eylem için bir denetleyici rolüne ihtiyacınız var.` }); return
            }
            await interaction.showModal(AcceptStaffApplicationModal)
        }
    } catch (error) {
        console.error(error)
        interaction[interaction.replied || interaction.deferred ? 'editReply' : 'reply']({ ephemeral: interaction.replied || interaction.deferred ?  null : true , content: `Bir hata oluştu.` })
    }
})