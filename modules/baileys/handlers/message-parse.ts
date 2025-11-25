import type { WAMessage } from "baileys";
export class MessageParse {
    constructor() { }
    fetch(msg: WAMessage) {
        const { key, pushName, message, messageTimestamp } = msg
        const { remoteJid, id, participant, remoteJidAlt, participantAlt } = key
        const ObjectMessage = message?.extendedTextMessage ? message.extendedTextMessage : message?.conversation ? message.conversation : null
        if (remoteJid == 'status@broadcast') return null
        console.log({ remoteJid, id, participant, remoteJidAlt, participantAlt, pushName, messageTimestamp, ObjectMessage })
    }
}

export interface IMessageParse {
    fetch(message: WAMessage): void | null
}