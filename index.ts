import Socket from '@baileys/baileys'
import config from '@bot/bot-config'
import command from '@baileys/handlers/command-handling'
import premium from '@bot/premium'

const bot = new Socket

await premium.init()
await command.init()
await config.init()
await bot.init('./auth')
