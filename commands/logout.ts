import type { ICTX } from "@baileys/handlers/command-handling"

export default {
    name: 'logout',
    async execute({}, {msg, socket}: ICTX ) {
        await socket.logout('Logget out')
    }
}