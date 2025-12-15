import type { ICTX } from "@baileys/handlers/command-handling"

export default {
    name: 'ping',
    async execute({}, {msg, socket}: ICTX ) {
        socket.sendMessage(msg.remoteJid, {text: 'Pong!'}, {ephemeralExpiration: msg.expiration, quoted: msg.raw})
    }
}