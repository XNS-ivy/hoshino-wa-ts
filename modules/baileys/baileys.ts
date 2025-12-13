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
import { MessageParse } from './handlers/message-parse'
import command from './handlers/command-handling'

export default class Socket {
    private sock: WASocket | null
    private logger = new Logger
    private parseChat = new MessageParse()
    private command = command
    private authPath: string | null
    private auth: ImprovedAuth | null
    private saveCreds: () => void

    constructor() {
        this.sock = null
        this.authPath = null
        this.auth = null
        this.saveCreds = async () => { }
    }

    async init(authFolderName: string) {
        this.logger.log('[Socket] Initialize System', 'system')
        this.authPath = authFolderName
        this.auth = new ImprovedAuth(`./${this.authPath!}`)
        const { sock, saveCreds } = await this.SocketConfiguration()
        this.sock = sock
        this.saveCreds = saveCreds
        await this.socketEvents()
    }


    private async SocketConfiguration(): Promise<ISockConfig> {
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

    private async socketEvents(): Promise<void> {
        if (!this.sock) return
        this.sock.ev.on('creds.update', () => {
            this.logger.log('[Creds] Saving Creds', 'system')
            this.saveCreds()
        })
        this.sock.ev.on('connection.update', async (connections) => {
            const { qr, lastDisconnect, connection } = connections
            if (connection) this.logger.log(`[Connection] ${connection}`, 'system')
            if (qr) console.log(await QRcode.toString(qr, { small: true, type: 'terminal' }))
            if (connection == 'close' && lastDisconnect) await this.handleSocketDisconnect(lastDisconnect)
        })
        this.sock.ev.on('messages.upsert', async (message) => {
            const { messages, type } = message
            let messageOutput = null
            if (type == 'notify') {
                for (const message of messages) {
                    messageOutput = await this.parseChat.fetch(message, type)
                }
            } if (type == 'append') {
                for (const message of messages) {
                    messageOutput = await this.parseChat.fetch(message, type)
                }
            }
            if (messageOutput != null) {
                this.logger.log(`[Message] Got New ${messageOutput.notifyType} Message`, 'info')
                if (messageOutput.commandContent != null && this.sock != null) {
                    this.logger.log(`[Commands] Executing Cooamnd: ${messageOutput.commandContent.cmd}`, 'system')
                    this.command.execute(messageOutput, this.sock)
                }
            }
        })
    }
    // ------ 

    private async handleSocketDisconnect({ error }: ILastDisconnect) {
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

interface ISockConfig {
    sock: WASocket,
    saveCreds: () => void,
}
interface ILastDisconnect {
    error?: Boom<unknown> | Error
    date: Date
}