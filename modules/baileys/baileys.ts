import { makeWASocket } from 'baileys'
import { ImprovedAuth } from './handlers/auth-state'
import { Logger } from '@logger/logger'
import type { WASocket, ConnectionState } from 'baileys'
import type { ILogger } from '@logger/logger'
import pino from 'pino'
import systemConfig from '@configs/system.json'
import QRcode from 'qrcode'

export default class Socket {
    public sock: WASocket | null
    private logger: ILogger
    authPath: string | null
    auth: ImprovedAuth | null
    saveCreds: () => void

    constructor() {
        this.sock = null
        this.authPath = null
        this.auth = null
        this.saveCreds = async () => { }
        this.logger = new Logger()
    }

    async init(authFolderName: `./${string}`) {
        this.logger.log('[Socket] Initialize System', 'system')
        this.authPath = authFolderName
        this.auth = new ImprovedAuth(this.authPath)
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
            this.logger.log('[Event] Saving Creds', 'info')
            this.saveCreds()
        })
        this.sock.ev.on('connection.update', async (connections) => {
            const { qr, lastDisconnect, connection } = connections
            if (connection) this.logger.log(`[Connection] ${connection}`, 'system')
            if (qr) console.log(await QRcode.toString(qr, { small: true, type: 'terminal' }))
            if (connection == 'close') await this.#handleSocketDisconnect()
        })
    }
    async #handleSocketDisconnect(){

    }
}