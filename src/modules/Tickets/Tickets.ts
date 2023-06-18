import { ButtonBuilder, ButtonStyle, ActionRowBuilder, ApplicationCommandOptionType, ChatInputCommandInteraction, TextChannel, Guild, GuildMember } from "discord.js"
import { addCommand, addInteraction } from "../../client.js"
import { model, Schema } from "mongoose"
import { ManagerRolesModel } from "../Roles/ManagerRoles.js"

export const StaffApplicationEnabledModel = model("StaffApplicationEnabled", new Schema({
    guildId: String,
}))


addCommand({
    name: "ticket-mesajı-gönder",
    description: "Ticket mesajını belirtilen kanala gönder.",
    options: [
        { name: "kanal", type: ApplicationCommandOptionType.Channel, description: "Ticket mesajının atılacağı kanal", required: true }
    ]
})
addCommand({
    name: "yetkili-alım-durumu",
    description: "Yetkili alım durumunu ayarlar.",
    options: [
        { name: "durum", type: ApplicationCommandOptionType.Boolean, description: "Yetkili alım durumu", required: true }
    ]
})


addInteraction(async (interaction: ChatInputCommandInteraction) => {
    try {
        if (!interaction.isChatInputCommand()) { return }
        if (interaction.commandName === "ticket-mesajı-gönder") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const TicketChannel = await interaction.guild.channels.fetch(interaction.options.get("kanal").channel.id) as TextChannel
            if (!TicketChannel) { return }
            TicketChannel.send({
                content: 'Aşağıdaki butonlar ile çeşitli amaçlar üzerine Ticket oluşturabilirsiniz.',
                components: [
                    new ActionRowBuilder<ButtonBuilder>({
                        components: [
                            new ButtonBuilder({
                                custom_id: "Complaint",
                                label: "Şikayet Bildir",
                                style: ButtonStyle.Secondary
                            }),
                            new ButtonBuilder({
                                custom_id: "StaffApplication",
                                label: "Yetkili Başvuru",
                                style: ButtonStyle.Secondary
                            }),
                            new ButtonBuilder({
                                custom_id: "DirectorComplaint",
                                label: "Şikayetini Direktöre Bildir (Geç Cevap)",
                                style: ButtonStyle.Danger
                            })
                        ]
                    })
                ]
            })
            interaction.editReply({  content: `Ticket mesajı gönderildi.` })
        } else if (interaction.commandName === "yetkili-alım-durumu") {
            await interaction.deferReply({ ephemeral: true })
            if (!await ManagerRolesModel.findOne({ roleId: { $in: (interaction.member as GuildMember).roles.cache.map(({ id }) => id) } })) {
                await interaction.editReply({  content: `Bu eylem için bir denetleyici rolüne ihtiyacınız var.` }); return
            }
            const status = interaction.options.get("durum").value
            if (status) {
                if (await StaffApplicationEnabledModel.findOne({ guildId: interaction.guildId })) { interaction.editReply({  content: `Yetkili başvuruları zaten açık.` }); return }
                await StaffApplicationEnabledModel.create({ guildId: interaction.guildId })
                interaction.editReply({  content: `Yetkili başvuruları açıldı.` })
            } else {
                if (!await StaffApplicationEnabledModel.findOne({ guildId: interaction.guildId })) { interaction.editReply({  content: `Yetkili başvuruları zaten kapalı.` }); return }
                await StaffApplicationEnabledModel.deleteOne({ guildId: interaction.guildId })
                interaction.editReply({  content: `Yetkili başvuruları kapandı.` })
            }
        }
    } catch (error) {
        console.error(error)
        interaction[interaction.replied || interaction.deferred ? 'editReply' : 'reply']({ ephemeral: interaction.replied || interaction.deferred ?  null : true , content: `Bir hata oluştu.` })
    }
})
