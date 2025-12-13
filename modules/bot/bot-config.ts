import path from "path"
import fs from "fs/promises"
import { watch } from "fs"
import configSchema from "@schemas/bot-configs-schema"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class BotConfigs {
    private configPath = path.resolve(__dirname, "../../configs/bot.json")
    private config: Record<string, any> | null = null
    private watching = false
    private initialized = false

    async init() {
        if (this.initialized) return
        this.initialized = true

        await this.load()
        await this.sanitize()
        this.watchFile()
    }

    private async load() {
        const file = await Bun.file(this.configPath).json()
        this.config = file
    }

    private async sanitize() {
        if (!this.config) return

        let updated = false

        for (const key in configSchema) {
            if (!(key in this.config)) {
                this.config[key] = configSchema[key as keyof typeof configSchema]
                updated = true
            }
        }

        for (const key in this.config) {
            if (!(key in configSchema)) {
                delete this.config[key]
                updated = true
            }
        }

        if (updated) {
            await fs.writeFile(
                this.configPath,
                JSON.stringify(this.config, null, 2)
            )
        }
    }

    private watchFile() {
        if (this.watching) return
        this.watching = true

        watch(this.configPath, async (event) => {
            if (event === "change") {
                await this.load()
                await this.sanitize()
            }
        })
    }

    async getConfig<K extends TypeKeyConfigs>(key: K): Promise<TypeValue<K>>
    async getConfig(): Promise<typeof configSchema>
    async getConfig(key?: TypeKeyConfigs) {
        if (!this.config) {
            throw new Error("Config has not been initialized. Call init() first.")
        }
        return key ? this.config[key] : this.config
    }

    async changeConfig<K extends TypeKeyConfigs>(key: K, value: TypeValue<K>) {
        if (!this.config) throw new Error("Config has not been initialized.")
        if (!(key in configSchema)) {
            throw new Error(`Key "${key}" not in schema config.`)
        }

        this.config[key] = value

        await fs.writeFile(
            this.configPath,
            JSON.stringify(this.config, null, 2)
        )
    }
}

const botConfigs = new BotConfigs()
export default botConfigs

type TypeKeyConfigs = keyof typeof configSchema
type TypeValue<T extends TypeKeyConfigs> = typeof configSchema[T]