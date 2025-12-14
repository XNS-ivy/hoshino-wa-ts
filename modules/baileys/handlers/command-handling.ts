import { type IMessageFetch } from './message-parse'
import { type WASocket } from 'baileys'
import { Logger } from '@logger/logger'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class CommandHandling {
    private commandPath = path.resolve(__dirname, "../../../commands/")
    private commands = new Map<string, ICommand>()
    private logger = new Logger
    constructor() { }
    async init() {
        await this.loadCommands(this.commandPath)
        this.logger.log(`[Commands] Loaded ${this.commands.size} commands`, 'success')
    }
    async execute(msg: IMessageFetch, socket: WASocket): Promise<void> {
        const { commandContent } = msg
        if (!commandContent || !msg.remoteJid) return

        const { cmd, args } = commandContent
        const command = this.commands.get(cmd)

        if (!command) return

        await command.execute(cmd, args, {
            msg,
            socket
        })

        this.logger.log(`[Commands] ${cmd} executed`, 'success')
    }
    private async loadCommands(dir: string) {
        const files = await fs.readdir(dir, { withFileTypes: true })

        for (const file of files) {
            const fullPath = path.join(dir, file.name)

            if (file.isDirectory()) {
                await this.loadCommands(fullPath)
                continue
            }

            if (!file.name.endsWith('.ts') && !file.name.endsWith('.js')) continue

            const module = await import(fullPath)
            const command = module.default as ICommand

            if (!command?.name || !command.execute) {
                this.logger.log(`[Commands] Invalid command file: ${file.name}`, 'warn')
                continue
            }

            this.commands.set(command.name, command)
        }
    }
}

export interface ICommand {
    name: string
    execute: (
        command: string,
        args: string[] | null | undefined,
        ctx: {
            msg: IMessageFetch
            socket: WASocket
        }
    ) => Promise<void> | void
}


const command = new CommandHandling
export default command