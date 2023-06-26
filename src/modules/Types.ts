import { ClientEvents, Awaitable } from "discord.js"
import { RawApplicationCommandData } from "discord.js/typings/rawDataTypes.js"
export type Identity<T> = { [P in keyof T]: T[P] }
export type Replace<T, K extends keyof T, TReplace> = Identity<Pick<T, Exclude<keyof T, K>> & {
    [P in K] : TReplace
}>

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type CommandDataType<name extends string> = PartialBy<Replace<RawApplicationCommandData, 'name', name>, "id" | "application_id" | "type" | "version" | "default_member_permissions">

export type CommandInteractionsType<CommandName extends string> = Map<CommandName, CommandDataType<CommandName>>
export type DiscordEventsSetType<K extends keyof ClientEvents> = Set<(...args: ClientEvents[K]) => Awaitable<void>>
export type DiscordEventsMapType<K extends keyof ClientEvents> = Map<K, DiscordEventsSetType<K>>

