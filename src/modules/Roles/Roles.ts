import { ApplicationCommandOptionType, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { addCommand, addInteraction } from "../../client.js";

addCommand({
    name: "rol-al",
    description: "Etiketlenen grupdan belirtilen rolü alır.",
    options: [
        { name: "grup", type: ApplicationCommandOptionType.Mentionable, description: "Rol alınacak grup", required: true },
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Alınacak rol", required: true }
    ]
})
addCommand({
    name: "rol-ver",
    description: "Etiketlenen gruba belirtilen rolü verir.",
    options: [
        { name: "grup", type: ApplicationCommandOptionType.Mentionable, description: "Rol verilecek grup", required: true },
        { name: "rol", type: ApplicationCommandOptionType.Role, description: "Verilecek rol", required: true }
    ]
})

addInteraction(async (interaction: ChatInputCommandInteraction) => {
    try {
        if (!interaction.isChatInputCommand()) { return }
        if (interaction.commandName === "rol-ver") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const group = interaction.options.get("grup")
            const roleId = interaction.options.get("rol").role.id
            const Promises = []
            if (group.role) {
                const members = await interaction.guild.members.fetch()
                members.forEach((member) => {
                    if (!member.roles.cache.has(group.role.id)) { return }
                    if (member.roles.cache.has(roleId)) { return }
                    Promises.push(member.roles.add(roleId))
                })
            } else if (group.member) {
                if ((group.member as GuildMember).roles.cache.has(roleId)) { return }
                Promises.push((group.member as GuildMember).roles.add(roleId))
            }
            await interaction.editReply({  content: `${group.role ? `<@${group.role.id}> grubuna` : group.member ? `<@&${group.user.id}> üyesine` : ''} <@&${roleId}> rolü veriliyor..` })
            await Promise.all(Promises)
            await interaction.editReply({ content: `${group.role ? `<@${group.role.id}> grubuna` : group.member ? `<@&${group.user.id}> üyesine` : ''} <@&${roleId}> rolü verildi.` })
        } else if (interaction.commandName === "rol-al") {
            await interaction.deferReply({ ephemeral: true })
            if (!interaction.memberPermissions.has("Administrator")) { interaction.editReply({  content: `Bu komutu kullanabilmek için yetkili değilsiniz.` }); return }
            const group = interaction.options.get("grup")
            const roleId = interaction.options.get("rol").role.id
            const Promises = []
            if (group.role) {
                const members = await interaction.guild.members.fetch()
                members.forEach((member) => {
                    if (!member.roles.cache.has(group.role.id)) { return }
                    if (!member.roles.cache.has(roleId)) { return }
                    Promises.push(member.roles.remove(roleId))
                })
            } else if (group.member) {
                if ((group.member as GuildMember).roles.cache.has(roleId)) { return }
                Promises.push((group.member as GuildMember).roles.add(roleId))
            }
            await interaction.editReply({  content: `${group.role ? `<@${group.role.id}> grubundan` : group.member ? `<@&${group.user.id}> üyesinden` : ''} <@&${roleId}> rolü alınıyor..` })
            await Promise.all(Promises)
            await interaction.editReply({ content: `${group.role ? `<@${group.role.id}> grubundan` : group.member ? `<@&${group.user.id}> üyesinden` : ''} <@&${roleId}> rolü alındı.` })
        }
    } catch (error) {
        console.error(error)
        interaction[interaction.replied ? 'editReply' : 'reply']({ ephemeral: interaction.replied ?  null : true , content: `Bir hata oluştu.` })
    }
})