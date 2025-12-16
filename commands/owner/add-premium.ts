import type { ICTX } from "@baileys/handlers/command-handling"
import premium from "@bot/premium"
import getOwner from "@functions/getOwner"

export default {
    name: 'addprem',
    access: 'owner',
    async execute(args: string[], { msg, socket, whoAMI }: ICTX) {
        // need to future fix
        const owner = getOwner(msg.lid, socket.user?.lid as string)
        console.log(args, msg.lid, socket.user?.lid)

        if (owner == true) {
            premium.addPremium(args)
            socket.sendMessage(msg.remoteJid, { text: 'Added To Premium', mentions: args }, { quoted: msg.raw, ephemeralExpiration: msg.expiration })
        } else {
            socket.sendMessage(msg.remoteJid, { text: 'Nuhuh' }, { ephemeralExpiration: msg.expiration, quoted: msg.raw })
        }

    }
}