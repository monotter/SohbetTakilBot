import { Routes } from 'discord.js'
import { rest, client, DiscordEvents, CommandInteractions } from '../client.js'
export const controller = {
    status: true
}
// import "./WelcomeMessage.js"
// import "./MemberSize.js"

// import "./Roles/Roles.js"
// import "./Roles/AutoRoles.js"
// import "./Roles/BoosterRoles.js"
// import "./Roles/BotRoles.js"

// import "./Roles/StaffRoles.js"
// import "./Roles/ManagerRoles.js"
// import "./Roles/DirectorRoles.js"

// import "./Ping.js"


// import "./Tickets/DirectorComplaintTickets.js"
// import "./Tickets/StaffAplicationTickets.js"
// import "./Tickets/ComplaintTickets.js"
// import "./Tickets/Tickets.js"
import "./PrivateRoom.js"

try {
    rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), { body: Array.from(CommandInteractions).map(({"1": CommandData }) => CommandData) })

    DiscordEvents.forEach((Listeners, Event) => {
        client.on(Event, (...args) => {
            Listeners.forEach((Listener) => {
                try {
                    if (!controller.status) { return }
                    Listener(...args)
                } catch (error) {
                    console.error(error)
                }
            })
        })
    })
} catch (error) {
    console.error(error)
}