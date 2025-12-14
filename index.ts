import Socket from '@baileys/baileys'
import Config from 'modules/bot/bot-config'
import command from '@baileys/handlers/command-handling'

const bot = new Socket
const config = Config

await command.init()
await config.init()
await bot.init('./auth')
