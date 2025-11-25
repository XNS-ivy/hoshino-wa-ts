import { makeWASocket } from 'baileys'
import { ImprovedAuth } from './handlers/auth-state'
import { Logger } from '@logger/logger'
import { type WASocket, DisconnectReason } from 'baileys'
import type { ILogger } from '@logger/logger'
import pino from 'pino'
import systemConfig from '@configs/system.json'
import QRcode from 'qrcode'
import type { Boom } from '@hapi/boom'
import fs from 'fs'
import { MessageParse, type IMessageParse } from './handlers/message-parse'

export default class Socket {
    public sock: WASocket | null
    private logger: ILogger
    private parseChat: IMessageParse
    authPath: string | null
    auth: ImprovedAuth | null
    saveCreds: () => void

    constructor() {
        this.sock = null
        this.authPath = null
        this.auth = null
        this.saveCreds = async () => { }
        this.logger! = new Logger()
        this.parseChat! = new MessageParse()
    }

    async init(authFolderName: string) {
        this.logger.log('[Socket] Initialize System', 'system')
        this.authPath = authFolderName
        this.auth = new ImprovedAuth(`./${this.authPath!}`)
        const { sock, saveCreds } = await this.#SocketConfiguration()
        this.sock = sock
        this.saveCreds = saveCreds
        await this.#socketEvents()
    }


    async #SocketConfiguration() {
        this.logger.log('[Socket] Loading Socket Configurations', 'system')

        if (!this.auth) throw new Error("Auth not initialized")
        const { state, saveCreds } = this.auth
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            markOnlineOnConnect: false,
            logger: pino({ level: systemConfig.BAILEYS_LOG_LEVEL })
        })

        return { sock, saveCreds }
    }

    async #socketEvents() {
        if (!this.sock) return
        this.sock.ev.on('creds.update', () => {
            this.logger.log('[Event] Saving Creds', 'system')
            this.saveCreds()
        })
        this.sock.ev.on('connection.update', async (connections) => {
            const { qr, lastDisconnect, connection } = connections
            if (connection) this.logger.log(`[Connection] ${connection}`, 'system')
            if (qr) console.log(await QRcode.toString(qr, { small: true, type: 'terminal' }))
            if (connection == 'close' && lastDisconnect) await this.#handleSocketDisconnect(lastDisconnect)
        })
        this.sock.ev.on('messages.upsert', async (message) => {
            const { messages, type } = message
            if (type == 'notify') {
                for (const message of messages) {
                    // this.logger.log('[Event] Got New Notify Message', 'info')
                    this.parseChat.fetch(message)
                }
            } if (type == 'append') {
                for (const message of messages) {
                    // this.logger.log('[Event] Got New Appended Message', 'info')
                    this.parseChat.fetch(message)
                }
            }
        })
    }
    // ------ 

    async #handleSocketDisconnect({ error }: ILastDisconnect) {
        const code = (error as Boom<unknown>)?.output?.statusCode
        switch (code) {
            case DisconnectReason.loggedOut:
            case DisconnectReason.badSession:
            case DisconnectReason.multideviceMismatch:
            case DisconnectReason.connectionReplaced:
                this.logger.log(`[Disconnect] ${error?.message} ${code}`, 'error')
                setTimeout(async () => {
                    this.logger.log('[Disconnect] Deleting Auth', 'system')
                    fs.rmSync(`./${this.authPath!}`, { force: true, recursive: true })
                    this.logger.log(`[Disconnect] Reconnecting`, 'system')
                    this.init(this.authPath!)
                })
                break
            case DisconnectReason.connectionLost:
            case DisconnectReason.connectionClosed:
            case DisconnectReason.restartRequired:
            case DisconnectReason.unavailableService:
            case DisconnectReason.forbidden:
                this.logger.log(`[Disconnect] ${error?.message} ${code}`, 'error')
                setTimeout(async () => {
                    this.logger.log('[Disconnect] Reconnecting', 'system')
                    await this.init(this.authPath!)
                }, 1000)
                break
        }
    }
}

interface ILastDisconnect {
    error?: Boom<unknown> | Error
    date: Date
}