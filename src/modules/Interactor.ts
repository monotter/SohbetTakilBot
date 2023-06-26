import { ButtonBuilder, ModalBuilder } from "@discordjs/builders";
import { APIButtonComponentWithCustomId, APIModalInteractionResponseCallbackData, Awaitable, ButtonInteraction, ClientEvents, CommandInteraction, ModalSubmitInteraction } from "discord.js";
import { CommandInteractions, DiscordEvents } from "../client.js";
import { CommandDataType, Replace } from "./Types.js";

export function CreateEvent<K extends keyof ClientEvents>(Event: K, RunFunction: (...args: ClientEvents[K]) => Awaitable<void>) {
    if (!DiscordEvents.has(Event)) { DiscordEvents.set(Event, new Set()) }
    const EventSet = DiscordEvents.get(Event)
    EventSet.add(RunFunction)
}
export function CreateChatCommand<name extends string>(CommandData: CommandDataType<name>, RunFunction: (interaction: Replace<CommandInteraction, 'commandName', name>, Data: URLSearchParams) => Awaitable<void>) {
    CommandInteractions.set(CommandData.name, CommandData)
    CreateEvent("interactionCreate", (interaction) => {
        if (!interaction.isChatInputCommand()) { return }
        const State = interaction.commandName.split("?")
        const CommandName = State[0]
        const Data = new URLSearchParams(State[1])
        if (CommandName !== CommandData.name) { return }
        RunFunction(interaction as any, Data)
    })
}
export function CreateModalInteraction<customId extends string>(ModalData: Replace<Partial<APIModalInteractionResponseCallbackData>, 'custom_id', customId>, RunFunction: (interaction: Replace<ModalSubmitInteraction, 'customId', customId>, Data: URLSearchParams) => Awaitable<void>) {
    CreateEvent("interactionCreate", (interaction) => {
        if (!interaction.isModalSubmit()) { return }
        const State = interaction.customId.split("?")
        const CustomId = State[0]
        const Data = new URLSearchParams(State[1])
        if (CustomId !== ModalData.custom_id) { return }
        RunFunction(interaction as any, Data)
    })
    return new ModalBuilder(ModalData)
}
export function CreateButtonInteraction<customId extends string>(ButtonData: Replace<Partial<APIButtonComponentWithCustomId>, 'custom_id', customId>, RunFunction: (interaction: Replace<ButtonInteraction, 'customId', customId>, Data: URLSearchParams) => Awaitable<void>) {
    CreateEvent("interactionCreate", (interaction) => {
        if (!interaction.isButton()) { return }
        const State = interaction.customId.split("?")
        const CustomId = State[0]
        const Data = new URLSearchParams(State[1])
        if (CustomId !== ButtonData.custom_id) { return }
        RunFunction(interaction as any, Data)
    })
    return new ButtonBuilder(ButtonData)
}