import { type IMessageFetch } from './message-parse'
import { type WASocket } from 'baileys'
import {Logger} from '@logger/logger'
export class CommandHandling {
    private logger = new Logger
    constructor() { }
    async init() { }
    async execute(msg: IMessageFetch, socket: WASocket): Promise<void> {
        const { commandContent } = msg
        if (commandContent?.cmd == 'hello' && msg.remoteJid) {
            socket.sendMessage(msg.remoteJid, { text: 'holla' }, { ephemeralExpiration: msg.expiration, quoted: msg.raw })
            this.logger.log(`[Commands] commands: ${commandContent.cmd} executed succesfully`, 'success')
        }
    }
}

const command = new CommandHandling
export default command