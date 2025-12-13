import Socket from '@baileys/baileys'
import Config from 'modules/bot/bot-config'
const bot = new Socket
const config = Config

await config.init()
await bot.init('./auth')
