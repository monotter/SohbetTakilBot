import { model, Schema } from "mongoose";

export const ServerSettingsModel = model("ServerSettings", new Schema({
    guildId: String,
    privateRoomChannelId: String,
    memberSizeChannel: {
        name: String,
        channelId: String,
    },
    welcomeMessageChannelId: String,
    staffApplicationEnabled: Boolean,
    staffRoleIds: [String],
    managerRoleIds: [String],
    directorRoleIds: [String],
    botRoleIds: [String],
    boosterRoleIds: [String],
    autoRoleIds: [String],
}))

export type ValidServerSettings = 'privateRoomChannelId' | 'memberSizeChannel' | 'welcomeMessageChannelId' | 'staffApplicationEnabled' | 'staffRoleIds' | 'managerRoleIds' | 'directorRoleIds' | 'botRoleIds' | 'boosterRoleIds' | 'autoRoleIds'
export const ServerSettingsCache = await ServerSettingsModel.find()
export async function SetServerSetting<Setting extends ValidServerSettings>(guildId: String, setting: Setting, value: (typeof ServerSettingsCache)[number][Setting], forcecache?: boolean) {
    let ServerSettings = ServerSettingsCache.find((s) => guildId === s.guildId)
    if (!ServerSettings || forcecache) {
        ;((index) => (index > -1 && ServerSettingsCache.splice(index, 1)))(ServerSettingsCache.indexOf(ServerSettings))
        ServerSettings = await ServerSettingsModel.findOneAndUpdate({ guildId }, { [setting]: value })
        if (ServerSettings) { ServerSettingsCache.push(ServerSettings) }
        else { ServerSettingsCache.push(await ServerSettingsModel.create({ guildId, [setting]: value })) }
        return
    }
    await ServerSettings.updateOne({ [setting]: value })
    ServerSettings[setting] = value as never
}
export async function GetServerSetting<Setting extends ValidServerSettings>(guildId: String, setting: Setting, forcecache?: boolean): Promise<(typeof ServerSettingsCache)[number][Setting]> {
    let ServerSettings = ServerSettingsCache.find((s) => guildId === s.guildId)
    if (!ServerSettings || forcecache) {
        ;((index) => (index > -1 && ServerSettingsCache.splice(index, 1)))(ServerSettingsCache.indexOf(ServerSettings))
        ServerSettings = await ServerSettingsModel.findOne({ guildId })
        if (ServerSettings) { ServerSettingsCache.push(ServerSettings) }
        else {
            ServerSettings = await ServerSettingsModel.create({ guildId })
            ServerSettingsCache.push(ServerSettings)
        }
    }
    return ServerSettings[setting]
}