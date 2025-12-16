import path from "path"
import fs from "fs"
import logger from "@logger/logger"
import premiumSchema, { type Premium } from "@schemas/premium-schema"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const filePath = "../../databases/premium.json"

class PremiumSubscription {
    private dbPath = path.resolve(__dirname, filePath)
    private premium: Record<string, Premium> = {}
    private logger = logger
    async init() {
        try {
            const db = fs.readFileSync(this.dbPath, "utf-8")
            this.premium = JSON.parse(db)
        } catch {
            this.premium = {}
            this.save()
        }
        this.startWatcher()
        this.logger.log('[Premium] Premium System Loaded', "system")
    }

    private save() {
        fs.writeFileSync(
            this.dbPath,
            JSON.stringify(this.premium, null, 2)
        )
        this.logger.log('[Premium] Saving Current Premium Records', 'success')
    }

    private parseDuration(input?: string): number {
        if (!input) return 86_400_000 // default 1 day

        const match = input.match(/^(\d+)([smhd])$/)
        if (!match) return 86_400_000

        const value = Number(match[1])
        const unit = match[2]
        if (!unit) return 86_400_000

        const map: Record<'s' | 'm' | 'h' | 'd', number> = {
            s: 1000,
            m: 60_000,
            h: 3_600_000,
            d: 86_400_000,
        }

        return value * map[unit as keyof typeof map]
    }
    async addPremium(args: string[]) {
        if (args.length === 0) return

        const lastArg = args[args.length - 1]
        if (!lastArg) return
        const isDuration = /^\d+[smhd]$/.test(lastArg)

        const duration = this.parseDuration(isDuration ? lastArg : undefined)
        const lids = isDuration ? args.slice(0, -1) : args

        const now = Date.now()

        for (const lid of lids) {
            this.premium[lid] = {
                ...premiumSchema,
                expiredTimeStamp: now + duration,
            }
        }

        this.save()
        this.logger.log('[Premium] Adding New Premium Member', 'system')
    }

    async deletePremium(lid: string | string[]) {
        if (Array.isArray(lid)) {
            for (const id of lid) {
                delete this.premium[id]
            }
        } else {
            delete this.premium[lid]
        }
        this.save()
        this.logger.log('[Premium] Deleting Premium Member', 'system')
    }

    async getPremium(lid: string): Promise<boolean> {
        const p = this.premium[lid]
        if (!p) return false

        if (Date.now() > p.expiredTimeStamp) {
            delete this.premium[lid]
            this.save()
            return false
        }

        return true
    }

    async checkPremium(lid: string): Promise<string | null> {
        const p = this.premium[lid]
        if (!p) return null

        const remaining = p.expiredTimeStamp - Date.now()

        if (remaining <= 0) {
            delete this.premium[lid]
            this.save()
            return null
        }

        return this.formatDuration(remaining)
    }

    private startWatcher() {
        setInterval(() => {
            this.logger.log('[Premium] Checking Premium', 'info')
            const now = Date.now()
            let changed = false

            for (const jid in this.premium) {
                const entry = this.premium[jid]
                if (!entry) continue

                if (now > entry.expiredTimeStamp) {
                    delete this.premium[jid]
                    changed = true
                }
            }

            if (changed) this.save()
        }, 60_000)
    }
    private formatDuration(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000)

        const days = Math.floor(totalSeconds / 86400)
        const hours = Math.floor((totalSeconds % 86400) / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        const parts = []
        if (days) parts.push(`${days} day`)
        if (hours) parts.push(`${hours} hours`)
        if (minutes) parts.push(`${minutes} minutes`)
        if (seconds) parts.push(`${seconds} second`)

        return parts.join(' ')
    }
}

const dbPremium = new PremiumSubscription()
export default dbPremium