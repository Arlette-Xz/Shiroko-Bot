// SHIROKO-BOT
// =========================
// Desarrolladora: Arlette Xz (GitHub: Arlette-Xz)
// Repositorio: https://github.com/Arlette-Xz/Shiroko-Bot

// Inspirado en:
// - Jadibot (arquitectura)
// - MysticBot-MD (2024)

// Técnico:
// v1.0.3 | JavaScript/Node.js
// Diciembre 2025 | En desarrollo

// Nota: Código original con mejoras propias.
// =========================

import { 
    useMultiFileAuthState, 
    DisconnectReason, 
    makeCacheableSignalKeyStore, 
    fetchLatestBaileysVersion 
} from "@whiskeysockets/baileys"
import qrcode from "qrcode"
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
import { makeWASocket } from '../../lib/simple.js'
import { fileURLToPath } from 'url'
import { Boom } from '@hapi/boom'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let rtx = '✿ `Vincula tu cuenta usando el QR.`\n\n'
rtx += '[ ✰ ] Instrucciones:\n'
rtx += '*1 » Opciones adicionales*\n'
rtx += '*2 » Dispositivos vinculados*\n'
rtx += '*3 » Vincular nuevo dispositivo*\n'
rtx += '*4 » Escanear código QR*\n\n'
rtx += '> *Nota:* Código válido por 30 segundos'

let rtx2 = '✿ `Vincula tu cuenta usando el código.`\n\n'
rtx2 += '[ ✰ ] Instrucciones:\n'
rtx2 += '*1 » Opciones adicionales*\n'
rtx2 += '*2 » Dispositivos vinculados*\n'
rtx2 += '*3 » Vincular nuevo dispositivo*\n'
rtx2 += '*4 » Vincular usando número*\n\n'
rtx2 += '> *Nota:* Código exclusivo para este número'

if (!(global.conns instanceof Array)) global.conns = []
if (!global.isSent) global.isSent = {} 

function msToTime(duration) {
    var seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60)
    return `${minutes} m y ${seconds} s`
}

function cleanInactiveSessions() {
    const sessionPath = path.join(`./${global.jadi}/`)
    if (!fs.existsSync(sessionPath)) return
    
    const files = fs.readdirSync(sessionPath)
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000

    files.forEach(file => {
        const filePath = path.join(sessionPath, file)
        const stats = fs.statSync(filePath)
        if (now - stats.mtimeMs > oneDay) {
            fs.rmSync(filePath, { recursive: true, force: true })
            console.log(chalk.yellow(`[ LIMPIEZA ] Sesión inactiva eliminada: ${file}`))
        }
    })
}

export async function shirokoJadiBot(options) {
    let { pathshirokoJadiBot, m, conn, args, usedPrefix, command, fromCommand } = options
    const mcode = (command === 'code' || (args && args.includes('--code')))
    const userId = m?.sender ? m.sender.split`@`[0] : path.basename(pathshirokoJadiBot)
    
    if (global.conns[userId]?.sock) {
        try { global.conns[userId].sock.ws.close() } catch {}
    }
    
    const { state, saveCreds } = await useMultiFileAuthState(pathshirokoJadiBot)
    const { version } = await fetchLatestBaileysVersion()

    const connectionOptions = {
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        browser: ["Windows", "Chrome", "120.0.0.0"],
        version,
        markOnlineOnConnect: false,
        syncFullHistory: false,
        msgRetryCounterCache: new NodeCache(),
        connectTimeoutMs: 30000,
        keepAliveIntervalMs: 15000
    }

    let sock = makeWASocket(connectionOptions)
    let startTime = Math.floor(Date.now() / 1000)
    sock.isInit = false

    async function connectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update
        
        if (qr && fromCommand && !global.isSent[userId]) {
            global.isSent[userId] = true 
            if (mcode) {
                setTimeout(async () => {
                    try {
                        let secret = await sock.requestPairingCode(userId)
                        secret = secret.match(/.{1,4}/g)?.join("-")
                        await conn.sendMessage(m.chat, { text: rtx2 }, { quoted: m })
                        await conn.sendMessage(m.chat, { text: secret }, { quoted: m })
                    } catch (e) { global.isSent[userId] = false }
                }, 3000)
            } else {
                try {
                    await conn.sendMessage(m.chat, { 
                        image: await qrcode.toBuffer(qr, { scale: 8 }), 
                        caption: rtx 
                    }, { quoted: m })
                } catch (e) { global.isSent[userId] = false }
            }
        }

        if (connection === 'open') {
            sock.isInit = true
            global.isSent[userId] = true
            const user = sock.user.id.split(':')[0]
            
            global.conns[userId] = { sock, retries: 0 }
            if (!global.conns.some(s => s.user && s.user.id.split(':')[0] === user)) {
                global.conns.push(sock)
            }
            
            console.log(chalk.hex('#00FFFF')(`\n[ SUB-BOT ] `) + chalk.hex('#FFFFFF')(`+${user} Conectado correctamente.`))
            
            if (fromCommand && m && m.chat) {
                await conn.sendMessage(m.chat, { 
                    text: `❀ Has registrado un nuevo *Sub-Bot!* [@${userId}]\n\n> Puedes ver la información del bot usando el comando *${usedPrefix}infobot*`,
                    mentions: [m.sender]
                }, { quoted: m })
            }
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            
            if (reason === DisconnectReason.loggedOut || reason === 401) {
                try { 
                    sock.ws.close()
                    sock.ev.removeAllListeners()
                    if (fs.existsSync(pathshirokoJadiBot)) {
                        fs.rmSync(pathshirokoJadiBot, { recursive: true, force: true }) 
                    }
                } catch (e) {}
                delete global.isSent[userId]
                delete global.conns[userId]
            } else {
                setTimeout(() => shirokoJadiBot(options), 15000)
            }
        }
    }

    sock.ev.on('connection.update', connectionUpdate)
    sock.ev.on('creds.update', saveCreds)
    
    try {
        let handlerFile = await import('../shiroko.js')
        sock.handler = handlerFile.handler.bind(sock)
        
        sock.ev.on('messages.upsert', async (chatUpdate) => {
            for (let msg of chatUpdate.messages) {
                if (!msg.message) continue
                let msgTime = msg.messageTimestamp
                if (msgTime < startTime) continue 
                await sock.handler(chatUpdate)
            }
        })
    } catch (e) {}

    return true
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    cleanInactiveSessions()
    
    if (!globalThis.db.data.settings[conn.user.jid]?.jadibotmd) return m.reply(`ꕤ El Comando *${command}* está desactivado.`)
    
    let user = global.db.data.users[m.sender]
    let time = (user.Subs || 0) + 120000
    if (new Date() - (user.Subs || 0) < 120000) return conn.reply(m.chat, `ꕤ Debes esperar ${msToTime(time - new Date())} para volver a vincular un *Sub-Bot.*`, m)
    
    let socklimit = global.conns.filter(sock => sock?.user).length
    if (socklimit >= 50) return m.reply(`ꕤ No hay espacios disponibles para Sub-Bots.`)

    let id = `${m.sender.split`@`[0]}`
    let pathshirokoJadiBot = path.join(`./${global.jadi}/`, id)
    
    if (!fs.existsSync(pathshirokoJadiBot)) fs.mkdirSync(pathshirokoJadiBot, { recursive: true })

    global.isSent[id] = false 
    shirokoJadiBot({ pathshirokoJadiBot, m, conn, args, usedPrefix, command, fromCommand: true })
    user.Subs = new Date() * 1
}

handler.command = ['qr', 'code']
export default handler
