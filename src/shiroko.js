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
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
    clearTimeout(this)
    resolve()
}, ms))

const groupMetadataCache = new Map()
const participantCache = new Map()
const commandCache = new Map()

export async function handler(chatUpdate) {
    this.msgqueque = this.msgqueque || []
    this.uptime = this.uptime || Date.now()
    if (!chatUpdate) return
    this.pushMessage(chatUpdate.messages).catch(console.error)
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return
    if (global.db.data == null) await global.loadDatabase()

    try {
        m = smsg(this, m) || m
        if (!m) return
        if (m.isBaileys) return
        m.exp = 0

        try {
            const user = global.db.data.users[m.sender] || {}
            const chat = global.db.data.chats[m.chat] || {}
            const settings = global.db.data.settings[this.user.jid] || {}

            if (!global.db.data.users[m.sender]) {
                global.db.data.users[m.sender] = {
                    name: m.name,
                    exp: 0,
                    coin: 0,
                    bank: 0,
                    level: 0,
                    health: 100,
                    genre: "",
                    birth: "",
                    marry: "",
                    description: "",
                    packstickers: null,
                    premium: false,
                    premiumTime: 0,
                    banned: false,
                    bannedReason: "",
                    commands: 0,
                    afk: -1,
                    afkReason: "",
                    warn: 0
                }
            }

            if (!global.db.data.chats[m.chat]) {
                global.db.data.chats[m.chat] = {
                    isBanned: false,
                    isMute: false,
                    welcome: global.modes.welcome,
                    sWelcome: "",
                    sBye: "",
                    detect: global.modes.detect,
                    primaryBot: null,
                    modoadmin: global.modes.modoadmin,
                    antiLink: global.modes.antilink,
                    nsfw: global.modes.nsfw,
                    economy: global.modes.economy,
                    gacha: global.modes.gacha
                }
            }

            if (!global.db.data.settings[this.user.jid]) {
                global.db.data.settings[this.user.jid] = {
                    self: global.modes.self,
                    jadibotmd: global.modes.jadibotmd,
                    autoread: global.modes.autoread,
                    autoreaction: global.modes.autoreaction,
                    anticall: global.modes.anticall
                }
            }
        } catch (e) {
            console.error(e)
        }

        if (typeof m.text !== "string") m.text = ""
        const user = global.db.data.users[m.sender]
        const chat = global.db.data.chats[m.chat]
        const settings = global.db.data.settings[this.user.jid]
        const isROwner = global.owner.some(num =>
            num.replace(/[^0-9]/g, "") + "@s.whatsapp.net" === m.sender
        ) || m.fromMe
        const isOwner = isROwner
        const isPrems = isROwner ||
            global.prems.some(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net" === m.sender) ||
            user.premium
        const isOwners = [this.user.jid, ...global.owner.map(v => v + "@s.whatsapp.net")].includes(m.sender)

        if (opts["queque"] && m.text && !isPrems) {
            const queque = this.msgqueque
            const time = 1000 * 2
            queque.push(m.id || m.key.id)
            setTimeout(() => {
                const index = queque.indexOf(m.id || m.key.id)
                if (index !== -1) queque.splice(index, 1)
            }, time)
        }

        m.exp += Math.ceil(Math.random() * 10)
        let usedPrefix
        let groupMetadata, participants, userGroup, botGroup
        if (m.isGroup) {
            const cacheKey = m.chat
            const now = Date.now()
            const cached = groupMetadataCache.get(cacheKey)
            if (cached && (now - cached.timestamp) < 30000) {
                groupMetadata = cached.metadata
                participants = cached.participants
            } else {
                groupMetadata = await this.groupMetadata(m.chat).catch(_ => null) || {}
                participants = (groupMetadata.participants || []).map(p => ({
                    id: p.jid, jid: p.jid, lid: p.lid, admin: p.admin
                }))
                groupMetadataCache.set(cacheKey, {
                    metadata: groupMetadata,
                    participants: participants,
                    timestamp: now
                })
            }
            userGroup = participants.find(u => this.decodeJid(u.jid) === m.sender) || {}
            botGroup = participants.find(u => this.decodeJid(u.jid) === this.user.jid) || {}
        } else {
            participants = []
            userGroup = {}
            botGroup = {}
        }
        const isRAdmin = userGroup?.admin === "superadmin"
        const isAdmin = isRAdmin || userGroup?.admin === "admin"
        const isBotAdmin = botGroup?.admin || false
        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "./commands")

        for (const name in global.plugins) {
            const plugin = global.plugins[name]
            if (!plugin || plugin.disabled) continue
            const __filename = join(___dirname, name)
            if (typeof plugin.all === "function") {
                try {
                    await plugin.all.call(this, m, {
                        chatUpdate,
                        __dirname: ___dirname,
                        __filename,
                        user,
                        chat,
                        settings
                    })
                } catch (err) {
                    console.error(err)
                }
            }
            if (!opts["restrict"] && plugin.tags && plugin.tags.includes("admin")) {
                continue
            }
            const strRegex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
            const pluginPrefix = plugin.customPrefix || conn.prefix || global.prefix
            let match
            if (pluginPrefix instanceof RegExp) {
                match = [pluginPrefix.exec(m.text), pluginPrefix]
            } else if (Array.isArray(pluginPrefix)) {
                for (const prefix of pluginPrefix) {
                    const regex = prefix instanceof RegExp ? prefix : new RegExp(strRegex(prefix))
                    const execResult = regex.exec(m.text)
                    if (execResult) {
                        match = [execResult, regex]
                        break
                    }
                }
            } else {
                const prefixStr = typeof pluginPrefix === "string" ? pluginPrefix : ""
                const regex = new RegExp(strRegex(prefixStr))
                match = [regex.exec(m.text), regex]
            }
            if (typeof plugin.before === "function") {
                if (await plugin.before.call(this, m, {
                    match,
                    conn: this,
                    participants,
                    groupMetadata,
                    userGroup,
                    botGroup,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename,
                    user,
                    chat,
                    settings
                })) continue
            }
            if (typeof plugin !== "function") continue
            
            if (match && (usedPrefix = (match[0] || "")[0])) {
                const noPrefix = m.text.replace(usedPrefix, "")
                let [command, ...args] = noPrefix.trim().split(" ").filter(v => v)
                args = args || []
                let _args = noPrefix.trim().split(" ").slice(1)
                let text = _args.join(" ")
                command = (command || "").toLowerCase()
                const fail = plugin.fail || global.dfail
                const cacheKey = `${name}_${command}`
                let isAccept
                if (commandCache.has(cacheKey)) {
                    isAccept = commandCache.get(cacheKey)
                } else {
                    isAccept = plugin.command instanceof RegExp ?
                        plugin.command.test(command) :
                        Array.isArray(plugin.command) ?
                        plugin.command.some(cmd => cmd instanceof RegExp ?
                            cmd.test(command) : cmd === command) :
                        typeof plugin.command === "string" ?
                        plugin.command === command : false
                    commandCache.set(cacheKey, isAccept)
                }
                global.comando = command
                if (!isOwners && settings.self) return
                if ((m.id.startsWith("NJX-") || (m.id.startsWith("BAE5") && m.id.length === 16) || (m.id.startsWith("B24E") && m.id.length === 20))) return

                if (global.db.data.chats[m.chat].primaryBot && global.db.data.chats[m.chat].primaryBot !== this.user.jid) {
                    const primaryBotConn = global.conns.find(conn => conn.user.jid === global.db.data.chats[m.chat].primaryBot && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED)
                    const participants = m.isGroup ? (await this.groupMetadata(m.chat).catch(() => ({ participants: [] }))).participants : []
                    const primaryBotInGroup = participants.some(p => p.jid === global.db.data.chats[m.chat].primaryBot)
                    if (primaryBotConn && primaryBotInGroup || global.db.data.chats[m.chat].primaryBot === global.conn.user.jid) {
                        throw !1 
                    } else {
                        global.db.data.chats[m.chat].primaryBot = null
                    }
                }

                if (!isAccept) continue
                m.plugin = name
                
                if (isAccept) { 
                    global.db.data.users[m.sender].commands = (global.db.data.users[m.sender].commands || 0) + 1 
                }

                if (chat) {
                    const botId = this.user.jid
                    const primaryBotId = chat.primaryBot
                    if (name !== "group-banchat.js" && chat?.isBanned && !isAdmin && !isROwner) {
                        if (!primaryBotId || primaryBotId === botId) {
                            const aviso = global.msg.aviso
                                .replace('${botname}', global.botname)
                                .replace('${usedPrefix}', usedPrefix)
                            await m.reply(aviso)
                            return
                        }
                    }
                    if (m.text && user.banned && !isROwner) {
                        const mensaje = global.msg.mensaje
                            .replace('${bannedReason}', user.bannedReason)
                        if (!primaryBotId || primaryBotId === botId) {
                            m.reply(mensaje)
                            return
                        }
                    }
                }

                if (!isOwners && !m.chat.endsWith('g.us') && !/code|p|ping|qr|estado|status|infobot|botinfo|report|reportar|invite|join|logout|suggest|help|menu/gim.test(m.text)) return
                const adminMode = chat.modoadmin || false
                const wa = plugin.botAdmin || plugin.admin || plugin.group || plugin || noPrefix || pluginPrefix || m.text.slice(0, 1) === pluginPrefix || plugin.command
                if (adminMode && !isOwner && m.isGroup && !isAdmin && wa) return
                if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
                    fail("rowner", m, this)
                    continue
                }
                if (plugin.rowner && !isROwner) {
                    fail("rowner", m, this)
                    continue
                }
                if (plugin.owner && !isOwner) {
                    fail("owner", m, this)
                    continue
                }
                if (plugin.premium && !isPrems) {
                    fail("premium", m, this)
                    continue
                }
                if (plugin.group && !m.isGroup) {
                    fail("group", m, this)
                    continue
                } else if (plugin.botAdmin && !isBotAdmin) {
                    fail("botAdmin", m, this)
                    continue
                } else if (plugin.admin && !isAdmin) {
                    fail("admin", m, this)
                    continue
                }
                if (plugin.private && m.isGroup) {
                    fail("private", m, this)
                    continue
                }
                m.isCommand = true
                m.exp += plugin.exp ? parseInt(plugin.exp) : 10
                let extra = {
                    match,
                    usedPrefix,
                    noPrefix,
                    _args,
                    args,
                    command,
                    text,
                    conn: this,
                    participants,
                    groupMetadata,
                    userGroup,
                    botGroup,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename,
                    user,
                    chat,
                    settings
                }
                try {
                    await plugin.call(this, m, extra)
                } catch (err) {
                    m.error = err
                    console.error(err)
                } finally {
                    if (typeof plugin.after === "function") {
                        try {
                            await plugin.after.call(this, m, extra)
                        } catch (err) {
                            console.error(err)
                        }
                    }
                }
            }
        }
    } catch (err) {
        if (err === false) return 
        console.error(err)
    } finally {
        if (opts["queque"] && m.text) {
            const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
            if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1)
        }
        let user, stats = global.db.data.stats
        if (m) {
            if (m.sender && (user = global.db.data.users[m.sender])) {
                user.exp += m.exp
            }
        }
        try {
            if (!opts["noprint"]) await (await import("../lib/print.js")).default(m, this)
        } catch (err) {
            console.warn(err)
            console.log(m.message)
        }
    }
}

global.dfail = (type, m, conn) => {
    const msg = global.msg[type]
    if (msg) return conn.reply(m.chat, msg.replace('${comando}', global.comando), m, rcanal).then(_ => m.react('✖️'))
}

let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
    unwatchFile(file)
    console.log(chalk.magenta("Se actualizo 'shiroko'"))
    if (global.reloadHandler) console.log(await global.reloadHandler())
})
