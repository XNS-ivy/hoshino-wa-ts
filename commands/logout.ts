import type { ICTX } from "@baileys/handlers/command-handling"

export default {
    name: 'logout',
    access: 'owner',
    async execute({ }, { msg, socket }: ICTX) {
        const owner = socket?.user?.lid?.split(':')[0] == msg.lid.split('@')[0] ? 'owner' : 'notOwner'
        if (owner == this.access) {
            await socket.sendMessage(msg.remoteJid,
                { text: 'Bye bye.' },
                { ephemeralExpiration: msg.expiration, quoted: msg.raw })
            setTimeout(async () => {
                await socket.logout('Logget out')
            }, 5000)
        }
        else {
            await socket.sendMessage(msg.remoteJid,
                { text: 'You cant do that' },
                { ephemeralExpiration: msg.expiration, quoted: msg.raw })
        }
    }
}