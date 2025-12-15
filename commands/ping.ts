import type { ICTX } from "@baileys/handlers/command-handling"
import ping from 'ping'

export default {
    name: 'ping',
    async execute(args: string[], { msg, socket }: ICTX) {
        const target = args[0] ? args[0].replace(/^https?:\/\//, '') : 'google.com'
        const host = target.includes('.') ? target : `${target}.com`
        const delay = Date.now() - msg.messageTimestamp
        let networkLatency = null
        try {
            const res = await ping.promise.probe(host)
            networkLatency = res.time ? `${res.time} ms` : 'Timeout'
        } catch (err) {
            networkLatency = 'Error'
        }
        const text = `✅ Pong!\n📦 Command Latency: ${delay} ms\n🌐 Network Latency (${host}): ${networkLatency}`
        socket.sendMessage(msg.remoteJid, { text: text }, { ephemeralExpiration: msg.expiration, quoted: msg.raw })
    }
}