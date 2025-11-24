import path from 'path'
import fs from 'fs'
import { initAuthCreds, BufferJSON } from 'baileys'
import NodeCache from 'node-cache'

export class ImprovedAuth {
    private baseDir: string
    private credsPath: string
    private keyDirPath!: string
    cache
    creds
    constructor(baseDir: string = './auth') {
        this.baseDir! = baseDir
        this.credsPath! = path.join(this.baseDir, 'creds.json')
        this.keyDirPath! = path.join(this.baseDir,)
        fs.mkdirSync(this.keyDirPath!, { recursive: true })
        this.cache = new NodeCache({ stdTTL: 1800, checkperiod: 600, useClones: false })
        this.creds = this.#loadAuth(this.credsPath) || initAuthCreds()
    }
    #sanitizeFileName(name: string) {
        return name.replace(/[:<>"/\\|?*]/g, '_')
    }
    #loadAuth(file: string) {
        try {
            if (fs.existsSync(file)) {
                return JSON.parse(fs.readFileSync(file, 'utf-8'), BufferJSON.reviver)
            }
        } catch (e) {
            console.error('⚠️ [Auth] Failed to read', file, e)
        }
        return null
    }
    #saveAuth(file: string, data: string){
        try {

        }catch (e){
            
        }
    }
}