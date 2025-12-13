import type { WAMessage, proto, WAMessageKey } from "baileys"
import Config from "modules/bot/bot-config"


export class MessageParse {
    static denied: (keyof proto.IMessage)[] = [
        "protocolMessage",
        "senderKeyDistributionMessage",
        "messageContextInfo",
    ]
    private config = Config

    async fetch(msg: WAMessage, notifyType: string): Promise<IMessageFetch | null> {
        const { key, pushName, message, messageTimestamp } = msg
        const { remoteJid } = key
        const lid = this.getLID(key)

        if (!message || !pushName) return null
        if (remoteJid === "status@broadcast" || !remoteJid) return null

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
        const { text, description, caption, contextInfo, expiration } = content || {}
        const { quotedMessage, mentionedJid } = contextInfo || {}
        const chatExpiration = expiration > 0 ? expiration : 0
        const quoted = quotedMessage
            ? await this.quotedMessageFetch(quotedMessage)
            : null
        const prefix = await this.config.getConfig("prefix")
        const body = text ?? caption ?? ""
        let commandContent = null
        if (body.startsWith(prefix)) {
            const commandType = text ? "regular" : "mediaDownload"

            const [cmd, ...args] = body
                .slice(prefix.length)
                .trim()
                .split(/\s+/)
            commandContent = {
                commandType,
                cmd,
                args
            }
        }
        return {
            remoteJid,
            lid,
            key,
            pushName,
            messageTimestamp,
            type: messageObject,
            text,
            caption,
            description,
            expiration: chatExpiration,
            mentionedJid,
            quoted,
            raw: msg,
            rawQuoted: quotedMessage ?? null,
            commandContent,
            notifyType,
        }
    }

    private async quotedMessageFetch(qMsg: proto.IMessage): Promise<IQuotedMessage | null> {
        if (!qMsg) return null
        const extracted = this.extractQuoted(qMsg)
        if (!extracted) return null

        const quotedType = Object.keys(extracted)[0] as keyof proto.IMessage
        const quotedContent: any = extracted[quotedType]

        return {
            type: quotedType,
            text: quotedContent?.text ?? null,
            caption: quotedContent?.caption ?? null,
            description: quotedContent?.description ?? null,
            expiration: quotedContent?.expiration ?? 0,
            mentionedJid: quotedContent?.contextInfo?.mentionedJid ?? [],
            rawQuoted: extracted,
        }
    }

    private extractQuoted(quotedMessage: proto.IMessage | undefined): proto.IMessage | null {
        if (!quotedMessage) return null

        const msg = quotedMessage as proto.IMessage | undefined
        if (!msg) return null

        const keys = Object.keys(msg) as (keyof proto.IMessage)[]
        const main = keys.find(k => !MessageParse.denied.includes(k))
        if (!main) return null

        return {
            [main]: msg[main]
        }
    }

    private getLID(key: WAMessageKey): string | null {
        const lid = key?.remoteJid?.endsWith('@lid')
            ? key.remoteJid
            : key?.participant?.endsWith('@lid')
                ? key.participant
                : null
        return lid
    }
}

export interface IMessageParse {
    fetch(message: WAMessage): Promise<IMessageFetch | null>
}

interface IKeyFetch {
    remoteJid: string | null | undefined,
    lid: string | null,
    key: WAMessageKey,
}

interface IMessageFetch extends IKeyFetch {
    pushName: string | null | undefined,
    messageTimestamp: number | Long | null | undefined,
    type: string,
    messageObject?: string,
    text: string | null | undefined,
    caption: string | null | undefined,
    description: string | null | undefined,
    expiration: number,
    mentionedJid: Array<string> | [],
    quoted: IQuotedMessage | null,
    raw: WAMessage,
    rawQuoted?: proto.IMessage | null,
    commandContent: null | {
        commandType: string,
        cmd: string,
        args: Array<string>,
    }
    notifyType: string,
}

interface IQuotedMessage {
    type: string,
    text: string | null,
    caption: string | null,
    description: string | null,
    expiration: number,
    mentionedJid: Array<string | null>,
    rawQuoted: proto.IMessage,
}