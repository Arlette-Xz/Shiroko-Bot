// Made with love by Arlette Xz
// Inspirado en el jadibot de GataBot
// Código Hecho para Shiroko-Bot

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

let rtx = "✿ *Vincula tu cuenta usando el QR.*\n\n[ ✰ ] Sigue las instrucciones:\n*1 » Mas opciones*\n*2 » Dispositivos vinculados*\n*3 » Vincular nuevo dispositivo*\n*4 » Escanea este QR*\n\n> *Nota:* Este código QR expira en 30 segundos."
let rtx2 = "✿ *Vincula tu cuenta usando el código.*\n\n[ ✰ ] Sigue las instrucciones:\n*1 » Mas opciones*\n*2 » Dispositivos vinculados*\n*3 » Vincular nuevo dispositivo*\n*4 » Vincular usando numero*\n\n> *Nota:* Este Código solo funciona en el número que lo solicita"

if (!(global.conns instanceof Array)) global.conns = []

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!globalThis.db.data.settings[conn.user.jid]?.jadibotmd) return m.reply(`ꕥ El Comando *${command}* está desactivado.`)
    
    let time = global.db.data.users[m.sender].Subs + 120000
    if (new Date - global.db.data.users[m.sender].Subs < 120000) return conn.reply(m.chat, `ꕥ Debes esperar para volver a vincular un *Sub-Bot.*`, m)
    
    let socklimit = global.conns.filter(sock => sock?.user).length
    if (socklimit >= 50) return m.reply(`ꕥ No hay espacios disponibles para Sub-Bots.`)

    let id = `${m.sender.split`@`[0]}`
    let pathshirokoJadiBot = path.join(`./${global.jadi}/`, id)
    
    if (!fs.existsSync(pathshirokoJadiBot)) fs.mkdirSync(pathshirokoJadiBot, { recursive: true })

    shirokoJadiBot({ pathshirokoJadiBot, m, conn, args, usedPrefix, command, fromCommand: true })
    global.db.data.users[m.sender].Subs = new Date * 1
}

handler.command = ['qr', 'code', 'serbot']
export default handler 

export async function shirokoJadiBot(options) {
    let { pathshirokoJadiBot, m, conn, args, usedPrefix, command, fromCommand } = options
    const mcode = (command === 'code' || (args && args.includes('--code')))
    
    const { state, saveCreds } = await useMultiFileAuthState(pathshirokoJadiBot)
    const { version } = await fetchLatestBaileysVersion()

    let isSent = false 

    const connectionOptions = {
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        browser: ["Ubuntu", "Chrome", "118.0.0.0"],
        version,
        markOnlineOnConnect: false,
        syncFullHistory: false,
        msgRetryCounterCache: new NodeCache(),
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000
    }

    let sock = makeWASocket(connectionOptions)
    sock.isInit = false

    async function connectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update
        
        if (qr && fromCommand && !isSent) {
            isSent = true 
            if (mcode) {
                try {
                    let secret = await sock.requestPairingCode((m.sender.split`@`[0]))
                    secret = secret.match(/.{1,4}/g)?.join("-")
                    await conn.sendMessage(m.chat, { text: rtx2 }, { quoted: m })
                    await conn.sendMessage(m.chat, { text: secret }, { quoted: m })
                } catch (e) {
                    isSent = false
                }
            } else {
                try {
                    await conn.sendMessage(m.chat, { image: await qrcode.toBuffer(qr, { scale: 8 }), caption: rtx }, { quoted: m })
                } catch (e) {
                    isSent = false
                }
            }
        }

        if (connection === 'open') {
            sock.isInit = true
            isSent = true
            const user = sock.user.id.split(':')[0]
            
            if (!global.conns.some(s => s.user && s.user.id.split(':')[0] === user)) {
                global.conns.push(sock)
            }
            
            console.log(chalk.hex('#00FFFF')(`\n[ SUB-BOT ] `) + chalk.hex('#FFFFFF')(`+${user} Conectado correctamente.`))
            
            if (fromCommand && m) {
                await conn.sendMessage(m.chat, { 
                    text: `❀ Has registrado un nuevo *Sub-Bot!* [@${m.sender.split('@')[0]}]\n\n> Puedes ver la información del bot usando el comando *${usedPrefix}infobot*`,
                    mentions: [m.sender]
                }, { quoted: m })
            }
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            const botId = path.basename(pathshirokoJadiBot)

            if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.badSession || reason === 401) {
                console.log(chalk.hex('#FF0000')(`[ SESIÓN FINALIZADA ] `) + chalk.hex('#FFFFFF')(`+${botId} Borrando datos...`))
                try { 
                    sock.ev.removeAllListeners()
                    fs.rmSync(pathshirokoJadiBot, { recursive: true, force: true }) 
                } catch (e) {}
                let i = global.conns.indexOf(sock)
                if (i >= 0) global.conns.splice(i, 1)
            } else {
                sock.ev.removeAllListeners()
                if (reason !== DisconnectReason.connectionClosed) {
                    setTimeout(() => shirokoJadiBot(options), 10000)
                }
            }
        }
    }

    sock.ev.on('connection.update', connectionUpdate)
    sock.ev.on('creds.update', saveCreds)
    
    try {
        let handlerFile = await import('../shiroko.js')
        sock.handler = handlerFile.handler.bind(sock)
        sock.ev.on('messages.upsert', sock.handler)
    } catch (e) {}

    return sock
}
