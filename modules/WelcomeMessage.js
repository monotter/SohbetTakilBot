import { AttachmentBuilder } from "discord.js";
import { createCanvas, loadImage } from "canvas";
import { client } from "../client.js";

client.on('guildMemberAdd', async (member) => {
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
    client.channels.cache.get('1107671915356749845').send({ files: [attachment], content: `Hoş geldin <@${member.user.id}>` })
})

client.on('guildMemberRemove', async (member) => {
    client.channels.cache.get('1107671915356749845').send({ content: `**${ member.user.tag }** Aramızdan ayrıldı, görüşmek üzere..` })
})