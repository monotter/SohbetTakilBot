import { ApplicationCommandOptionType, ChatInputCommandInteraction, AttachmentBuilder, TextChannel } from "discord.js";
import { model, Schema } from "mongoose";
import { createCanvas, loadImage } from "canvas";
import { addCommand, client, addInteraction } from "../client.js";

export const WelcomeMessageChannelModel = model("WelcomeMessageChannel", new Schema({
    name: String,
    channelId: String,
    guildId: String,
}))


addCommand({
    name: "hoşgeldin-kanalı-ayarla",
    description: "Hoş geldin mesajının kanalını ayarlar",
    options: [
        { name: "kanal", type: ApplicationCommandOptionType.Channel, description: "Hoş geldin mesajlarının atılacağı kanal", required: true }
    ]
})
addCommand({
    name: "hoşgeldin-kanalı-kaldir",
    description: "Hoş geldin kanalını iptal eder.",
})
addCommand({
    name: "hoşgeldin-kanalı-göster",
    description: "Hoş geldin kanalını gösterir.",
})

addInteraction(async (interaction: ChatInputCommandInteraction) => {
    try {
        if (!interaction.isChatInputCommand()) { return }
        if (!interaction.memberPermissions.has("Administrator")) { interaction.reply({ ephemeral: true, content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
        if (interaction.commandName === "hoşgeldin-kanalı-ayarla") {
            const channelId = interaction.options.get("kanal").channel.id
            const document = await WelcomeMessageChannelModel.findOne({ guildId: interaction.guildId })
            if (document) {
                await WelcomeMessageChannelModel.updateOne({ _id: document._id }, { channelId })
            } else {
                await WelcomeMessageChannelModel.create({ channelId, guildId: interaction.guildId })
            }
            interaction.reply({ ephemeral: true, content: `Hoş geldin mesajları <#${channelId}> kanalına atılacak şekilde ayarlandı.` })
        } else if (interaction.commandName === "hoşgeldin-kanalı-kaldir") {
            const document = await WelcomeMessageChannelModel.findOne({ guildId: interaction.guildId })
            if (!document) { interaction.reply({ ephemeral: true, content: `Şu anda hoş geldin mesajlarının atılacağı bir kanal bulunmamakta.` }); return }
            await WelcomeMessageChannelModel.deleteOne({ _id: document._id })
            interaction.reply({ ephemeral: true, content: `Artık <#${document.channelId}> kanalına hoş geldin mesajları gönderilmeyecek.` })
        } else if (interaction.commandName === "hoşgeldin-kanalı-göster") {
            const document = await WelcomeMessageChannelModel.findOne({ guildId: interaction.guildId })
            if (!document) { interaction.reply({ ephemeral: true, content: `Şu anda hoş geldin mesajlarının atılacağı bir kanal bulunmamakta.` }); return }
            interaction.reply({ ephemeral: true, content: `Hoş geldin mesajları <#${document.channelId}> kanalına gönderiliyor.` })
        }
    } catch (error) {
        console.error(error)
        interaction[interaction.replied ? 'editReply' : 'reply']({ ephemeral: interaction.replied ?  null : true , content: `Bir hata oluştu.` })
    }
})

client.on('guildMemberAdd', async (member) => {
    try {
        const WelcomeMessageChannelDocument = await WelcomeMessageChannelModel.findOne({ guildId: member.guild.id })
        const WelcomeMessageChannel = WelcomeMessageChannelDocument && await client.channels.fetch(WelcomeMessageChannelDocument.channelId) as TextChannel
        if (!WelcomeMessageChannel) { return }


        const Canvas = createCanvas(1100, 500)
        const Context = Canvas.getContext('2d')

        const user = await client.users.fetch(member.user.id, { force: true })
        const bannerURL = user.bannerURL({ extension: 'png', size: 2048 })

        if (bannerURL) {
            const image = await loadImage(bannerURL)
            Context.drawImage(image, 0, 0, 1100, 500)
        }
        Context.fillStyle = "rgba(0, 0, 0, 0.85)"
        Context.fillRect(0, 0, 1100, 500)

        Context.fillStyle = "white";
        Context.textAlign = "center";
        Context.font = '40px sans-serif'
        Context.fillText(`${ member.user.tag } sunucuya katıldı`, 550, 395)

        Context.font = '30px sans-serif'
        Context.fillStyle = "gray";
        Context.fillText(`Mevcut üye sayısı: #${member.guild.memberCount}`, 550, 440)

        Context.beginPath();
        Context.arc(550, 205, 130, 0, Math.PI * 2);
        Context.fillStyle = "white";
        Context.fill();
        const avatarURL = member.user.avatarURL({ extension: 'png', size: 1024 })
        if (avatarURL) {
            const image = await loadImage(avatarURL)
            Context.save();
            Context.beginPath();
            Context.arc(550, 205, 125, 0, Math.PI * 2, true);
            Context.closePath();
            Context.clip();
            Context.drawImage(image, 425, 80, 250, 250);
            Context.restore();
        }

        const attachment = new AttachmentBuilder(Canvas.toBuffer(), { name: `welcome-${member.user.tag}.png` })
        WelcomeMessageChannel.send({ files: [attachment], content: `Hoş geldin <@${member.user.id}>` })
    } catch (error) {
        console.error(error)
    }
})

client.on('guildMemberRemove', async (member) => {
    try {
        const WelcomeMessageChannelDocument = await WelcomeMessageChannelModel.findOne({ guildId: member.guild.id })
        const WelcomeMessageChannel = WelcomeMessageChannelDocument && await client.channels.fetch(WelcomeMessageChannelDocument.channelId) as TextChannel
        if (!WelcomeMessageChannel) { return }
        WelcomeMessageChannel.send({ content: `||${ member.user.id }|| **${ member.user.tag }** Aramızdan ayrıldı, görüşmek üzere..` })
    } catch (error) {
        console.error(error)
    }
})