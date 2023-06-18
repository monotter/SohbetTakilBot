import { ButtonBuilder, ButtonStyle, ActionRowBuilder, ApplicationCommandOptionType, ChatInputCommandInteraction, TextChannel } from "discord.js"
import { addCommand, addInteraction } from "../../client.js"
import { model, Schema } from "mongoose"

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
        if (!interaction.memberPermissions.has("Administrator")) { interaction.reply({ ephemeral: true, content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
        if (interaction.commandName === "ticket-mesajı-gönder") {
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
            interaction.reply({ ephemeral: true, content: `Ticket mesajı gönderildi.` })
        } else if (interaction.commandName === "yetkili-alım-durumu") {
            const status = interaction.options.get("durum").value
            if (status) {
                if (await StaffApplicationEnabledModel.findOne({ guildId: interaction.guildId })) { interaction.reply({ ephemeral: true, content: `Yetkili başvuruları zaten açık.` }); return }
                await StaffApplicationEnabledModel.create({ guildId: interaction.guildId })
                interaction.reply({ ephemeral: true, content: `Yetkili başvuruları açıldı.` })
            } else {
                if (!await StaffApplicationEnabledModel.findOne({ guildId: interaction.guildId })) { interaction.reply({ ephemeral: true, content: `Yetkili başvuruları zaten kapalı.` }); return }
                await StaffApplicationEnabledModel.deleteOne({ guildId: interaction.guildId })
                interaction.reply({ ephemeral: true, content: `Yetkili başvuruları kapandı.` })
            }
        }
    } catch (error) {
        console.error(error)
        interaction[interaction.replied ? 'editReply' : 'reply']({ ephemeral: interaction.replied ?  null : true , content: `Bir hata oluştu.` })
    }
})