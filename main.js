import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import fs, { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, watch } from 'fs'
import path, { join, dirname } from 'path'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import pino from 'pino'
import Pino from 'pino'
import { Boom } from '@hapi/boom'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import store from './lib/store.js'
import pkg from 'google-libphonenumber'
import { spawn } from 'child_process'
import readline from 'readline'
import NodeCache from 'node-cache'
import lodash from 'lodash'
import { shirokoJadiBot } from './src/commands/sockets-serbot.js'

const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()
const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser } = await import('@whiskeysockets/baileys')
const { chain, debounce } = lodash

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString()
}
global.__dirname = function dirname(pathURL) {
    return path.dirname(global.__filename(pathURL, true))
}
global.__require = function require(dir = import.meta.url) {
    return createRequire(dir)
}

if (typeof protoType === 'function') protoType();
if (typeof serialize === 'function') serialize();

const __dirname = global.__dirname(import.meta.url)

async function isValidPhoneNumber(number) {
    try {
        let num = String(number).replace(/\s+/g, '')
        if (num.startsWith('+521')) {
            num = num.replace('+521', '+52')
        } else if (num.startsWith('+52') && num[4] === '1') {
            num = num.replace('+52 1', '+52')
        }
        const parsedNumber = phoneUtil.parseAndKeepRawInput(num)
        return phoneUtil.isValidNumber(parsedNumber)
    } catch (error) {
        return false
    }
}

async function joinChannels(sock) {
    for (const value of Object.values(global.ch || {})) {
        if (typeof value === 'string' && value.endsWith('@newsletter')) {
            await sock.newsletterFollow(value).catch(() => {})
        }
    }
}

async function _quickTest() {
    const test = await Promise.all([
        spawn('ffmpeg'),
        spawn('ffprobe'),
        spawn('ffmpeg', ['-hidebanner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
        spawn('convert'),
        spawn('magick'),
        spawn('gm'),
        spawn('find', ['--version']),
    ].map((p) => {
        return Promise.race([
            new Promise((resolve) => {
                p.on('close', (code) => {
                    resolve(code !== 127)
                })
            }),
            new Promise((resolve) => {
                p.on('error', (_) => resolve(false))
            })
        ])
    }))
    const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test
    const s = global.support = { ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find }
    Object.freeze(global.support)
}

function getRelativePluginName(filePath) {
    const commandsFolder = global.__dirname(join(__dirname, './src/commands'))
    const relativePath = path.relative(commandsFolder, filePath)
    return relativePath.replace(/\\/g, '/')
}

async function loadCommandsFromFolders() {
    const commandsFolder = global.__dirname(join(__dirname, './src/commands'))
    global.plugins = {}
    async function loadFolder(folderPath, basePath = commandsFolder) {
        try {
            const items = readdirSync(folderPath)
            for (const item of items) {
                const fullPath = join(folderPath, item)
                const stat = statSync(fullPath)
                if (stat.isDirectory()) {
                    await loadFolder(fullPath, basePath)
                } else if (stat.isFile() && /\.js$/.test(item)) {
                    try {
                        const file = global.__filename(fullPath)
                        const module = await import(file)
                        const pluginName = getRelativePluginName(fullPath)
                        global.plugins[pluginName] = module.default || module
                    } catch (e) {
                        const pluginName = getRelativePluginName(fullPath)
                        console.error(chalk.red(`✗ Error al cargar ${pluginName}: ${e.message}`))
                        delete global.plugins[getRelativePluginName(fullPath)]
                    }
                }
            }
        } catch (error) {
            console.error(`Error al cargar carpeta ${folderPath}:`, error)
        }
    }
    await loadFolder(commandsFolder)
    console.log(chalk.hex('#00FFFF')(`✓ Comandos cargados: ${Object.keys(global.plugins).length}`))
}

async function _reloadCore(_ev, filename) {
    const commandsFolder = global.__dirname(join(__dirname, './src/commands'))
    const fullPath = global.__filename(join(__dirname, filename))
    if (fullPath.startsWith(commandsFolder) && /\.js$/.test(filename)) {
        const dir = global.__filename(join(__dirname, filename), true)
        const pluginName = getRelativePluginName(dir)
        if (existsSync(dir)) {
            if (pluginName in global.plugins) {
                console.log(chalk.white('ꕤ ') + chalk.hex('#00FFFF')('Cambio Realizado en') + chalk.white(`en "${pluginName}" `) + chalk.hex('#00FFFF')('con éxito.'))
            } else {
                 console.log(chalk.white('ꕤ ') + chalk.hex('#00FFFF')('Plugin Añadido ') + chalk.white(`"${pluginName}" `) + chalk.hex('#00FFFF')('con éxito.'))
            }
            const err = syntaxerror(readFileSync(dir), pluginName, {
                sourceType: 'module',
                allowAwaitOutsideFunction: true,
            })
            if (err) {
                conn.logger.error(`syntax error while loading '${pluginName}'\n${err}`)
            } else {
                try {
                    const module = await import(`${global.__filename(dir)}?update=${Date.now()}`)
                    global.plugins[pluginName] = module.default || module
                } catch (e) {
                    conn.logger.error(`error require plugin '${pluginName}'\n${e}`)
                } finally {
                    global.plugins = Object.fromEntries(
                        Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
                    )
                }
            }
        } else if (!existsSync(dir)) {
            if (pluginName in global.plugins) {
                console.log(chalk.white('ꕤ ') + chalk.hex('#FF0000')('Plugin Eliminado ') + chalk.white(`"${pluginName}" `) + chalk.hex('#FF0000')('con éxito.'))
                delete global.plugins[pluginName]
            }
        }
    }
}

global.reload = debounce(_reloadCore, 100)
Object.freeze(global.reload)

function setupWatcher() {
    const commandsFolder = global.__dirname(join(__dirname, './src/commands'))
    function watchFolder(folderPath) {
        watch(folderPath, (eventType, filename) => {
            if (filename) {
                const fullPath = join(folderPath, filename)
                const stat = existsSync(fullPath) ? statSync(fullPath) : null
                if (stat && stat.isDirectory()) {
                    watchFolder(fullPath)
                } else {
                    const relativePath = path.relative(__dirname, fullPath)
                    global.reload(eventType, relativePath)
                }
            }
        })
        try {
            const items = readdirSync(folderPath)
            for (const item of items) {
                const fullPath = join(folderPath, item)
                if (statSync(fullPath).isDirectory()) {
                    watchFolder(fullPath)
                }
            }
        } catch (error) {
            console.error(`Error set up watcher for ${folderPath}:`, error)
        }
    }
    watchFolder(commandsFolder)
}

async function connectionUpdate(update) {
    const { connection, lastDisconnect, isNewLogin } = update
    global.stopped = connection
    if (isNewLogin) conn.isInit = true
    const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
    if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
        await global.reloadHandler(true).catch(console.error)
        global.timestamp.connect = new Date()
    }
    if (global.db.data == null) global.loadDatabase()
    if (update.qr != 0 && update.qr != undefined || methodCodeQR) {
        if (opcion == '1' || methodCodeQR) {
            console.log(chalk.white(`[ 青 ]  Escanea este código QR`))
        }
    }
    if (connection === "open") {
        const userName = conn.user.name || conn.user.verifiedName || "Desconocido"
        await joinChannels(conn)
        console.log(chalk.white(`[ 青 ]  Conectado a: ${userName}`))
        const restartFile = join(__dirname, './src/json/restart.json')
        if (existsSync(restartFile)) {
            try {
                const data = JSON.parse(readFileSync(restartFile))
                await conn.sendMessage(data.chat, { text: 'ꕤ Reiniciado con éxito, nuevamente en línea.', edit: data.key })
                unlinkSync(restartFile)
            } catch (e) {
                console.error('Error al editar mensaje de reinicio:', e)
            }
        }
    }
    let reason = new Boom(lastDisconnect?.error)?.output?.statusCode
    if (connection === "close") {
        if ([401, 440, 428, 405].includes(reason)) {
            console.log(chalk.red(`→ (${code}) › Cierra la session Principal.`))
        }
        console.log(chalk.white("→ Reconectando el Bot Principal..."))
        await global.reloadHandler(true).catch(console.error)
    }
}

global.reloadHandler = async function (restatConn) {
    try {
        const Handler = await import(`./src/shiroko.js?update=${Date.now()}`).catch(console.error)
        if (Object.keys(Handler || {}).length) {
            handler = Handler
            if (global.processedMessages) {
                global.processedMessages.clear()
            }
        }
    } catch (e) { console.error(e) }
    if (restatConn) {
        const oldChats = global.conn.chats
        try { global.conn.ws.close() } catch { }
        conn.ev.removeAllListeners()
        global.conn = makeWASocket(connectionOptions, { chats: oldChats })
        isInit = true
    }
    if (!isInit) {
        conn.ev.off('messages.upsert', conn.handler)
        conn.ev.off('connection.update', conn.connectionUpdate)
        conn.ev.off('creds.update', conn.credsUpdate)
    }
    conn.handler = handler.handler.bind(global.conn)
    conn.connectionUpdate = connectionUpdate.bind(global.conn)
    conn.credsUpdate = saveCreds.bind(global.conn, true)
    if (!global.processedMessages) {
        global.processedMessages = new Set()
    }
    setInterval(() => {
        if (global.processedMessages && global.processedMessages.size > 1000) {
            global.processedMessages.clear()
        }
    }, 60000)
    conn.ev.on('messages.upsert', conn.handler)
    conn.ev.on('connection.update', conn.connectionUpdate)
    conn.ev.on('creds.update', conn.credsUpdate)
    isInit = false
    return true
}

const tmpDirCheck = join(__dirname, 'tmp')
if (!existsSync(tmpDirCheck)) mkdirSync(tmpDirCheck, { recursive: true })

await global.loadDatabase()

const { state, saveState, saveCreds } = await useMultiFileAuthState(global.sessions)
const msgRetryCounterCache = new NodeCache({ stdTTL: 120, checkperiod: 60 })
const userDevicesCache = new NodeCache({ stdTTL: 120, checkperiod: 60 })
const { version } = await fetchLatestBaileysVersion()
let phoneNumber = global.botNumber
const methodCodeQR = process.argv.includes("qr")
const methodCode = !!phoneNumber || process.argv.includes("code")
const MethodMobile = process.argv.includes("mobile")

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))
let opcion

if (methodCodeQR) opcion = '1'

if (!methodCodeQR && !methodCode && !fs.existsSync(`./${global.sessions}/creds.json`)) {
    do {
        console.log('')
        console.log(chalk.white('   ¿Cómo quieres conectar?'))
        console.log(chalk.white('   ') + chalk.hex('#00FFFF')('1) ') + chalk.white('Usar código QR'))
        console.log(chalk.white('   ') + chalk.hex('#00FFFF')('2) ') + chalk.white('Usar código de 8 dígitos'))
        console.log(chalk.white('   » Tu opción: '))
        opcion = await question('')
        if (!/^[1-2]$/.test(opcion)) {
            console.log(chalk.red('   Solo opciones 1 o 2'))
        }
    } while (opcion !== '1' && opcion !== '2' || fs.existsSync(`./${global.sessions}/creds.json`))
}
console.info = () => {}

const connectionOptions = {
    logger: pino({ level: 'silent' }),
    printQRInTerminal: opcion == '1' ? true : methodCodeQR ? true : false,
    mobile: MethodMobile,
    browser: ["Linux", "Chrome", "120.0.0.0", "Headless"],
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    getMessage: async (key) => {
        try {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        } catch (error) { return "" }
    },
    msgRetryCounterCache: msgRetryCounterCache,
    userDevicesCache: userDevicesCache,
    defaultQueryTimeoutMs: 2000,
    cachedGroupMetadata: (jid) => global.conn?.chats?.[jid] ?? {},
    version: version,
    keepAliveIntervalMs: 4000,
    maxIdleTimeMs: 8000,
    connectTimeoutMs: 6000,
    fireInitQueries: true,
    txnUpdateTimeoutMs: 1000,
    retryRequestDelayMs: 20,
    maxMsgRetryCount: 2,
    shouldIgnoreJid: (jid) => false,
    appStateMacVerification: { patch: false, snapshot: false },
    validateFingerprint: false,
    connectionStrategy: 'light',
    patchMessageBeforeSending: (message) => {
        if (message.buttonsMessage) delete message.buttonsMessage;
        if (message.listMessage) delete message.listMessage;
        if (message.templateMessage) delete message.templateMessage;
        return message;
    },
    downloadHistory: false,
    linkPreviewImageThumbnailWidth: 128,
    transactionOpts: { maxCommitRetries: 1, delayBetweenTriesMs: 300 },
    emitOwnEvents: false,
    defaultCacheExpiration: 30000,
    maxCachedMessages: 50,
    wsOptions: {
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.5',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Connection': 'Upgrade',
            'Upgrade': 'websocket'
        },
        maxPayload: 1048576,
        perMessageDeflate: false
    },
    fetchMessageMaxAttempts: 2,
    queryChatsTillReceived: false,
    emitPresenceUpdates: false,
    emitGroupParticipantsUpdate: false,
    emitGroupMetadataUpdate: false,
    emitChatUpdate: false,
    emitMessageUpdate: false,
    emitUnreadMessagesUpdate: false,
    emitUnreadCountsUpdate: false
}

global.conn = makeWASocket(connectionOptions)
conn.ev.on("creds.update", saveCreds)

if (!fs.existsSync(`./${global.sessions}/creds.json`)) {
    if (opcion === '2' || methodCode) {
        opcion = '2'
        if (!conn.authState.creds.registered) {
            let addNumber
            if (!!phoneNumber) {
                addNumber = String(phoneNumber).replace(/[^0-9]/g, '')
            } else {
                do {
                    console.log(chalk.hex('#00FFFF')('🐺 INGRESAR NÚMERO'))
                    console.log(chalk.white('[+] '))
                    phoneNumber = await question('')
                    phoneNumber = String(phoneNumber).replace(/\D/g, '')
                    if (!phoneNumber.startsWith('+')) phoneNumber = `+${phoneNumber}`
                } while (!await isValidPhoneNumber(phoneNumber))
                rl.close()
                addNumber = phoneNumber.replace(/\D/g, '')
                setTimeout(async () => {
                    let codeBot = await conn.requestPairingCode(addNumber)
                    codeBot = codeBot.match(/.{1,4}/g)?.join("-") || codeBot
                    console.log(chalk.hex('#00FFFF')('🔐 CÓDIGO GENERADO'))
                    console.log(chalk.hex('#00FFFF')('──────────────────────────'))
                    console.log(chalk.white('╔══════════════════════╗'))
                    console.log(chalk.white('║       ' + codeBot + '       ║'))
                    console.log(chalk.white('╚══════════════════════╝'))
                    console.log(chalk.hex('#00FFFF')('──────────────────────────'))
                }, 1000)
            }
        }
    }
}

process.on('uncaughtException', console.error)
process.on('unhandledRejection', (reason, promise) => {
    console.error("Rechazo no manejado detectado:", reason)
})

let isInit = true
let handler = await import('./src/shiroko.js')

_quickTest().catch(console.error)

global.rutaJadiBot = join(__dirname, `./${global.jadi}`)
if (global.shirokoJadibts) {
    if (!existsSync(global.rutaJadiBot)) {
        mkdirSync(global.rutaJadiBot, { recursive: true })
    }
    const readRutaJadiBot = readdirSync(global.rutaJadiBot)
    if (readRutaJadiBot.length > 0) {
        console.log(chalk.white(`→ Iniciando reconexión de Sub-Bots...`))
        for (const gjbts of readRutaJadiBot) {
            const botPath = join(global.rutaJadiBot, gjbts)
            if (existsSync(botPath) && statSync(botPath).isDirectory()) {
                const creds = join(botPath, 'creds.json')
                if (existsSync(creds)) {
                    setTimeout(async () => {
                        try {
                            await shirokoJadiBot({ 
                                pathshirokoJadiBot: botPath, 
                                m: null, 
                                conn: global.conn, 
                                args: [], 
                                usedPrefix: '/', 
                                command: 'qr', 
                                fromCommand: false 
                            })
                        } catch (e) {}
                    }, 5000)
                }
            }
        }
    }
}

if (!global.opts['test']) {
    if (global.db) setInterval(async () => {
        if (global.db.data) await global.db.write()
        if (global.opts['autocleartmp'] && global.support?.find) {
            const tmp = [join(__dirname, 'tmp'), join(__dirname, 'tmp'), join(__dirname, 'tmp', `${global.jadi}`)]
            tmp.forEach((filename) => spawn('find', [filename, '-amin', '3', '-type', 'f', '-delete']))
        }
    }, 60 * 1000)
}

setInterval(async () => {
    const tmpDirInterval = join(__dirname, 'tmp')
    try {
        if (existsSync(tmpDirInterval)) {
            const filenames = readdirSync(tmpDirInterval)
            filenames.forEach(file => {
                const filePath = join(tmpDirInterval, file)
                if (statSync(filePath).isFile() && !filePath.includes('Sessions') && !filePath.includes('sessions') && file !== 'config.json') {
                    unlinkSync(filePath)
                }
            })
        }
    } catch { }
}, 30 * 1000)

loadCommandsFromFolders().then((_) => Object.keys(global.plugins)).catch(console.error)

conn.isInit = false
console.log(chalk.hex('#00FFFF')('╔══════════════════════════════╗'))
console.log(chalk.hex('#00FFFF').bold('║         SHIROKO - LISTO        ║'))
console.log(chalk.hex('#00FFFF')('╚══════════════════════════════╝'))

setupWatcher()
await global.reloadHandler()
