import { makeWASocket } from 'baileys'
import { ImprovedAuth } from './handlers/auth-state'
import { Logger } from '@logger/logger'

import type { WASocket } from 'baileys'
import type { ILogger } from '@logger/logger'
export default class Socket {
    sock: WASocket | null
    logger: ILogger
    constructor() {
        this.sock = null
        this.logger = new Logger()
    }
    async init() {
        await this.#SocketConfiguration()
        this.logger.log('test', 'info')
    }
    async #SocketConfiguration() {
        // this.sock = makeWASocket({}) as WASocket
    }
}