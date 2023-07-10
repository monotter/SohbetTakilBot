import { ApplicationCommandOptionType, AttachmentBuilder, TextChannel, PermissionFlagsBits } from "discord.js";
import { createCanvas, loadImage } from "canvas";
import { CreateChatCommand, CreateEvent } from "./Interactor.js";
import { client } from "../client.js";
import { GetServerSetting, SetServerSetting } from "./ServerSettings.js";

CreateChatCommand({
    name: "hoşgeldin-kanalı-ayarla",
    description: "Hoş geldin mesajının kanalını ayarlar",
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    options: [
        { name: "kanal", type: ApplicationCommandOptionType.Channel, description: "Hoş geldin mesajlarının atılacağı kanal", required: true }
    ]
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
    const channelId = interaction.options.get("kanal").channel.id
    await SetServerSetting(interaction.guildId, 'welcomeMessageChannelId', channelId)
    interaction.editReply({ content: `Hoş geldin mesajları <#${channelId}> kanalına atılacak şekilde ayarlandı.` })
})

CreateChatCommand({
    name: "hoşgeldin-kanalı-kaldır",
    description: "Hoş geldin kanalını iptal eder.",
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
    const channelId = await GetServerSetting(interaction.guildId, 'welcomeMessageChannelId')
    if (!channelId) { interaction.editReply({ content: `Şu anda hoş geldin mesajlarının atılacağı bir kanal bulunmamakta.` }); return }
    await SetServerSetting(interaction.guildId, 'welcomeMessageChannelId', null)
    interaction.editReply({ content: `Artık <#${channelId}> kanalına hoş geldin mesajları gönderilmeyecek.` })
})

CreateChatCommand({
    name: "hoşgeldin-kanalı-göster",
    description: "Hoş geldin kanalını gösterir.",
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
}, async (interaction) => {
    await interaction.deferReply({ ephemeral: true })

    if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
    const channelId = await GetServerSetting(interaction.guildId, 'welcomeMessageChannelId')
    if (!channelId) { interaction.editReply({  content: `Şu anda hoş geldin mesajlarının atılacağı bir kanal bulunmamakta.` }); return }
    interaction.editReply({  content: `Hoş geldin mesajları <#${channelId}> kanalına gönderiliyor.` })
})
CreateEvent("guildMemberAdd", async (member) => {
    const channelId = await GetServerSetting(member.guild.id, 'welcomeMessageChannelId')
    const WelcomeMessageChannel = channelId && await client.channels.fetch(channelId) as TextChannel
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
})
CreateEvent("guildMemberRemove", async (member) => {
    const channelId = await GetServerSetting(member.guild.id, 'welcomeMessageChannelId')
    const WelcomeMessageChannel = channelId && await client.channels.fetch(channelId) as TextChannel
    if (!WelcomeMessageChannel) { return }
    WelcomeMessageChannel.send({ content: `||${ member.user.id }|| **${ member.user.tag }** Aramızdan ayrıldı, görüşmek üzere..` })
})