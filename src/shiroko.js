import { smsg } from "../lib/simple.js"
import { format } from "util"
import { fileURLToPath } from "url"
import path, { join } from "path"
import fs, { unwatchFile, watchFile } from "fs"
import chalk from "chalk"
import fetch from "node-fetch"
import ws from "ws"

const { proto } = (await import("@whiskeysockets/baileys")).default

const isNumber = x => typeof x === "number" && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))

const groupMetadataCache = new Map()

export async function handler(chatUpdate) {
    this.msgqueque = this.msgqueque || []
    this.uptime = this.uptime || Date.now()
    if (!chatUpdate) return

    this.pushMessage(chatUpdate.messages).catch(() => null)
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return
    if (global.db.data == null) await global.loadDatabase()

    try {
        m = smsg(this, m) || m
        if (!m || m.isBaileys) return
        m.exp = 0

        const { sender, chat: mChat, name: mName } = m
        const db = global.db.data

        if (!db.users[sender]) db.users[sender] = { name: mName, exp: 0, coin: 0, bank: 0, level: 0, health: 100, genre: "", birth: "", marry: "", description: "", packstickers: null, premium: false, premiumTime: 0, banned: false, bannedReason: "", commands: 0, afk: -1, afkReason: "", warn: 0 }
        if (!db.chats[mChat]) db.chats[mChat] = { isBanned: false, isMute: false, welcome: global.modes.welcome, sWelcome: "", sBye: "", detect: global.modes.detect, primaryBot: null, modoadmin: global.modes.modoadmin, antiLink: global.modes.antilink, nsfw: global.modes.nsfw, economy: global.modes.economy, gacha: global.modes.gacha }
        if (!db.settings[this.user.jid]) db.settings[this.user.jid] = { self: global.modes.self, jadibotmd: global.modes.jadibotmd, autoread: global.modes.autoread, autoreaction: global.modes.autoreaction, anticall: global.modes.anticall }

        const user = db.users[sender]
        const chat = db.chats[mChat]
        const settings = db.settings[this.user.jid]
        
        const isROwner = global.owner.some(num => num.replace(/[^0-9]/g, "") + "@s.whatsapp.net" === sender) || m.fromMe
        const isOwner = isROwner
        const isPrems = isROwner || global.prems.some(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net" === sender) || user.premium
        const isOwners = [this.user.jid, ...global.owner.map(v => v + "@s.whatsapp.net")].includes(sender)

        if (typeof m.text !== "string") m.text = ""
        m.exp += Math.ceil(Math.random() * 10)
        
        let usedPrefix
        let groupMetadata, participants, userGroup, botGroup

        if (m.isGroup) {
            const now = Date.now()
            const cached = groupMetadataCache.get(mChat)
            if (cached && (now - cached.timestamp) < 15000) {
                groupMetadata = cached.metadata
                participants = cached.participants
            } else {
                groupMetadata = await this.groupMetadata(mChat).catch(() => ({}))
                participants = (groupMetadata.participants || []).map(p => ({ id: p.jid, jid: p.jid, lid: p.lid, admin: p.admin }))
                groupMetadataCache.set(mChat, { metadata: groupMetadata, participants, timestamp: now })
            }
            userGroup = participants.find(u => this.decodeJid(u.jid) === sender) || {}
            botGroup = participants.find(u => this.decodeJid(u.jid) === this.user.jid) || {}
        } else {
            participants = []; userGroup = {}; botGroup = {}
        }

        const isRAdmin = userGroup?.admin === "superadmin"
        const isAdmin = isRAdmin || userGroup?.admin === "admin"
        const isBotAdmin = botGroup?.admin || false
        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "./commands")

        const strRegex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
        const plugins = Object.entries(global.plugins)

        for (const [name, plugin] of plugins) {
            if (!plugin || plugin.disabled) continue

            if (typeof plugin.all === "function") {
                plugin.all.call(this, m, { chatUpdate, user, chat, settings }).catch(() => null)
            }

            if (!opts["restrict"] && plugin.tags?.includes("admin")) continue

            const pluginPrefix = plugin.customPrefix || this.prefix || global.prefix
            let match = null

            if (m.text) {
                const prefixStr = Array.isArray(pluginPrefix) ? pluginPrefix.map(p => strRegex(p)).join('|') : strRegex(pluginPrefix)
                const regex = new RegExp(`^(${prefixStr})`)
                const execResult = regex.exec(m.text)
                if (execResult) match = [execResult, regex]
            }

            if (typeof plugin.before === "function") {
                if (await plugin.before.call(this, m, { match, conn: this, participants, groupMetadata, userGroup, botGroup, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, user, chat, settings })) continue
            }

            if (typeof plugin !== "function" || !match) continue

            usedPrefix = match[0][0]
            const noPrefix = m.text.slice(usedPrefix.length).trim()
            let [command, ...args] = noPrefix.split(/\s+/).filter(v => v)
            command = (command || "").toLowerCase()

            const isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) :
                             Array.isArray(plugin.command) ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
                             plugin.command === command

            global.comando = command
            if (!isOwners && settings.self) return
            if (/^(NJX-|BAE5|B24E)/.test(m.id)) return

            if (chat.primaryBot && chat.primaryBot !== this.user.jid) {
                const primaryBotConn = global.conns?.find(conn => conn.user.jid === chat.primaryBot && conn.ws.socket?.readyState !== ws.CLOSED)
                const isPrimaryInGroup = participants.some(p => p.jid === chat.primaryBot)
                if ((primaryBotConn && isPrimaryInGroup) || chat.primaryBot === global.conn.user.jid) return 
                else chat.primaryBot = null
            }

            if (!isAccept) continue
            
            m.plugin = name
            user.commands = (user.commands || 0) + 1

            if (chat.isBanned && !isAdmin && !isROwner && name !== "group-banchat.js") {
                await m.reply(global.msg.aviso.replace('${botname}', global.botname).replace('${usedPrefix}', usedPrefix))
                return
            }

            if (user.banned && !isROwner) {
                m.reply(global.msg.mensaje.replace('${bannedReason}', user.bannedReason))
                return
            }

            if (!isOwners && !m.chat.endsWith('g.us') && !/code|p|ping|qr|estado|status|infobot|botinfo|report|reportar|invite|join|logout|suggest|help|menu/gim.test(m.text)) return
            
            const wa = plugin.botAdmin || plugin.admin || plugin.group || plugin.command
            if (chat.modoadmin && !isOwner && m.isGroup && !isAdmin && wa) return

            const fail = plugin.fail || global.dfail
            if ((plugin.rowner || plugin.owner) && !isOwner) { fail("owner", m, this); continue }
            if (plugin.premium && !isPrems) { fail("premium", m, this); continue }
            if (plugin.group && !m.isGroup) { fail("group", m, this); continue }
            if (plugin.botAdmin && !isBotAdmin) { fail("botAdmin", m, this); continue }
            if (plugin.admin && !isAdmin) { fail("admin", m, this); continue }
            if (plugin.private && m.isGroup) { fail("private", m, this); continue }

            m.isCommand = true
            m.exp += plugin.exp ? parseInt(plugin.exp) : 10
            const extra = { match, usedPrefix, noPrefix, args, command, text: args.join(" "), conn: this, participants, groupMetadata, userGroup, botGroup, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, user, chat, settings }

            try {
                await plugin.call(this, m, extra)
            } catch (err) {
                console.error(err)
            } finally {
                if (typeof plugin.after === "function") {
                    try { await plugin.after.call(this, m, extra) } catch (e) {}
                }
            }
            break 
        }
    } catch (err) {
        console.error(err)
    } finally {
        if (m?.sender && global.db.data.users[m.sender]) {
            global.db.data.users[m.sender].exp += m.exp || 0
        }
        if (!opts["noprint"]) {
            import("../lib/print.js").then(ptr => ptr.default(m, this)).catch(() => null)
        }
    }
}

global.dfail = (type, m, conn) => {
    const msg = global.msg[type]
    if (msg) return conn.reply(m.chat, msg.replace('${comando}', global.comando), m, rcanal).then(_ => m.react('✖️'))
}
