import { ButtonBuilder, ActionRowBuilder, ApplicationCommandOptionType, TextChannel, GuildMember, ComponentType, ButtonStyle } from "discord.js"
import { ManagerRolesModel } from "../Roles/ManagerRoles.js"
import { CreateChatCommand } from "../Interactor.js"
import { SetServerSetting, GetServerSetting } from "../ServerSettings.js"
import { ComplaintButton } from "./ComplaintTickets.js"
import { DirectorComplaintButton } from "./DirectorComplaintTickets.js"
import { StaffApplicationButton } from "./StaffAplicationTickets.js"

CreateChatCommand({
    name: "ticket-mesajı-gönder",
    description: "Ticket mesajını belirtilen kanala gönder.",
    options: [
        { name: "kanal", type: ApplicationCommandOptionType.Channel, description: "Ticket mesajının atılacağı kanal", required: true }
    ]
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
    const TicketChannel = await interaction.guild.channels.fetch(interaction.options.get("kanal").channel.id) as TextChannel
    if (!TicketChannel) { return }

    TicketChannel.send({
        content: 'Aşağıdaki butonlar ile çeşitli amaçlar üzerine Ticket oluşturabilirsiniz.',
        components: [
            new ActionRowBuilder<ButtonBuilder>({
                components: [
                    ComplaintButton,
                    StaffApplicationButton,
                    DirectorComplaintButton
                ]
            })
        ]
    })
    interaction.editReply({  content: `Ticket mesajı gönderildi.` })
})
CreateChatCommand({
    name: "yetkili-alım-durumu",
    description: "Yetkili alım durumunu ayarlar.",
    options: [
        { name: "durum", type: ApplicationCommandOptionType.Boolean, description: "Yetkili alım durumu", required: true }
    ]
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (!await ManagerRolesModel.findOne({ roleId: { $in: (interaction.member as GuildMember).roles.cache.map(({ id }) => id) } })) {
        await interaction.editReply({  content: `Bu eylem için bir denetleyici rolüne ihtiyacınız var.` }); return
    }
    const status = interaction.options.get("durum").value
    const current = await GetServerSetting(interaction.guildId, 'staffApplicationEnabled')
    if (status) {
        if (current) { interaction.editReply({ content: `Yetkili başvuruları zaten açık.` }); return }
        await SetServerSetting(interaction.guildId, 'staffApplicationEnabled', !!status)
        interaction.editReply({  content: `Yetkili başvuruları açıldı.` })
    } else {
        if (!current) { interaction.editReply({  content: `Yetkili başvuruları zaten kapalı.` }); return }
        await SetServerSetting(interaction.guildId, 'staffApplicationEnabled', !!status)
        interaction.editReply({  content: `Yetkili başvuruları kapandı.` })
    }
})