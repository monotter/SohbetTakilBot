import { Routes } from 'discord.js'
import { getCommands, rest } from '../client.js'
import "./WelcomeMessage.js"
import "./MemberSize.js"
import "./AutoRoles.js"
import "./Ping.js"

try {
    rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: getCommands() })
} catch (error) {
    console.error(error)
}
