import { Routes } from 'discord.js'
import { getCommands, rest, client, getInteractions } from '../client.js'
import "./WelcomeMessage.js"
import "./MemberSize.js"

import "./Roles/Roles.js"
import "./Roles/AutoRoles.js"
import "./Roles/BoosterRoles.js"
import "./Roles/BotRoles.js"

import "./Roles/StaffRoles.js"
import "./Roles/ManagerRoles.js"
import "./Roles/DirectorRoles.js"

import "./Ping.js"


import "./Tickets/DirectorComplaintTickets.js"
import "./Tickets/StaffAplicationTickets.js"
import "./Tickets/ComplaintTickets.js"
import "./Tickets/Tickets.js"

try {
    rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), { body: getCommands() })
    client.on('interactionCreate', (Interaction) => {
        getInteractions().forEach(a => a(Interaction))
    })
} catch (error) {
    console.error(error)
}