import colors from 'colors'
import systemConfig from '@configs/system.json'

export class Logger {
    private botLogLevel: BotLogLevel

    constructor() {
        this.botLogLevel = systemConfig.BOT_LOG_LEVEL
    }

    #getTimeStamp(): string {
        const d = new Date()
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const pad = (n: number) => String(n).padStart(2, '0')

        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${days[d.getDay()]}`
    }

    log(msg: string, level: Level) {
        if (this.botLogLevel === 'silent') return null
        switch (level) {
            case 'info': return this.#info(msg)
            case 'warn': return this.#warn(msg)
            case 'error': return this.#error(msg)
            case 'success': return this.#success(msg)
            case 'system': return this.#system(msg)
        }
    }

    #info(msg: string) {
        console.log(
            colors.blue('> [INFO] :'),
            colors.white(msg),
            colors.gray(`| ${this.#getTimeStamp()}`)
        )
    }

    #warn(msg: string) {
        console.log(
            colors.yellow('> [WARN] :'),
            colors.white(msg),
            colors.gray(`| ${this.#getTimeStamp()}`)
        )
    }

    #error(msg: string) {
        console.log(
            colors.red('> [ERROR] :'),
            colors.white(msg),
            colors.gray(`| ${this.#getTimeStamp()}`)
        )
    }

    #success(msg: string) {
        console.log(
            colors.green('> [SUCCESS] :'),
            colors.white(msg),
            colors.gray(`| ${this.#getTimeStamp()}`)
        )
    }

    #system(msg: string) {
        console.log(
            colors.magenta('> [SYSTEM] :'),
            colors.white(msg),
            colors.gray(`| ${this.#getTimeStamp()}`)
        )
    }
}

export type Level = 'info' | 'warn' | 'error' | 'success' | 'system'
export type BotLogLevel = 'silent' | 'info' | 'debug' | string

export interface ILogger {
    log(msg: string, level: Level): void | null
}