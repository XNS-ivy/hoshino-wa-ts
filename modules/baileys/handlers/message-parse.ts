import type { WAMessage, proto } from "baileys"

type MessageContent = NonNullable<
    proto.IMessage[keyof proto.IMessage]
>

export class MessageParse {
    static denied: (keyof proto.IMessage)[] = [
        "protocolMessage",
        "senderKeyDistributionMessage",
        "messageContextInfo",
    ]

    fetch(msg: WAMessage) {
        const { key, pushName, message, messageTimestamp } = msg
        const { remoteJid } = key

        if (!message || !pushName) return null
        if (remoteJid === "status@broadcast") return null

        const m = message as proto.IMessage
        const res: Partial<Record<keyof proto.IMessage, any>> = {}
        for (const k of Object.keys(m) as (keyof proto.IMessage)[]) {
            if (!MessageParse.denied.includes(k)) {
                res[k] = m[k]
            }
        }
        const messageObject = Object.keys(res)[0] as keyof proto.IMessage
        if (!messageObject) return null
        const content = res[messageObject]
        const { text, description, caption, contextInfo, expiration } = content
        const { quotedMessage, mentionedJid } = contextInfo
        console.log({ key, pushName, messageTimestamp, messageObject, text, caption, description, expiration, contextInfo, res })
    }
}

export interface IMessageParse {
    fetch(message: WAMessage): void | null;
}