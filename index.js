Process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'

import './src/config.js'
import './src/commands/main-allfake.js'
import cfonts from 'cfonts'
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import fs, { existsSync, mkdirSync, readFileSync } from 'fs'
import path, { join } from 'path'
import yargs from 'yargs'
import { Low, JSONFile } from 'lowdb'
import lodash from 'lodash'
import chalk from 'chalk'

const { chain } = lodash

setTimeout(async () => {
    try {
        const zr1Module = await import('zr1-optimizer')
        global.zr1 = zr1Module.zr1 || zr1Module.default
        if (global.zr1 && typeof global.zr1.optimize === 'function') {
            global.zr1.optimize({
                memory: true,
                performance: true,
                cache: true,
                connection: true
            })
        }
    } catch (e) {}
}, 2000)

let { say } = cfonts
console.clear()
console.log(chalk.hex('#00FFFF')('╔══════════════════════════════╗'))
console.log(chalk.hex('#00FFFF').bold('║         SHIROKO - BOT         ║'))
console.log(chalk.hex('#00FFFF')('╚══════════════════════════════╝'))

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString()
}

global.__dirname = function dirname(pathURL) {
    return path.dirname(global.__filename(pathURL, true))
}

global.__require = function require(dir = import.meta.url) {
    return createRequire(dir)
}

global.timestamp = { start: new Date() }
const __dirname = global.__dirname(import.meta.url)

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

let prefixArray = Array.isArray(global.prefix) ? global.prefix : [global.prefix || ':']
let escapedPrefix = prefixArray.map(p => {
    return p.replace(/[|\\^$.*+?()[\]{}!]/g, '\\$&')
}).join('|')
global.prefix = new RegExp(`^(${escapedPrefix})`)

const databaseDir = join(__dirname, 'src/database')
if (!existsSync(databaseDir)) {
    mkdirSync(databaseDir, { recursive: true })
}

global.db = new Low(
    /https?:\/\//.test(global.opts['db'] || '') ? 
    new cloudDBAdapter(global.opts['db']) : 
    new JSONFile(join(databaseDir, 'database.json'))
)
global.DATABASE = global.db

global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) {
        return new Promise((resolve) => {
            const helperInterval = setInterval(async function () {
                if (!global.db.READ) {
                    clearInterval(helperInterval)
                    resolve(global.db.data == null ? global.loadDatabase() : global.db.data)
                }
            }, 500)
        })
    }
    if (global.db.data !== null) return
    global.db.READ = true
    await global.db.read().catch(console.error)
    global.db.READ = null
    
    global.db.data = {
        users: {},
        chats: {},
        stats: {},
        msgs: {},
        sticker: {},
        settings: {},
        ...(global.db.data || {}),
    }
    
    global.db.chain = chain(global.db.data)
}

loadDatabase().then(() => {
    import('./main.js').catch(console.error)
    console.log(chalk.hex('#00FFFF')('✓ Base de datos cargada correctamente'))
}).catch(console.error)
