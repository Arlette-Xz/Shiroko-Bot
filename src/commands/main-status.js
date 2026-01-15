import { cpus as _cpus, totalmem, freemem, platform, hostname } from 'os'
import { sizeFormatter } from 'human-readable'

const format = sizeFormatter({ std: 'JEDEC', decimalPlaces: 2, keepTrailingZeroes: false, render: (l, s) => `${l} ${s}B` })
const arch = process.arch
const plt = platform()
const host = hostname().slice(0, 8)
const cpuLen = _cpus().length

let handler = async (m, { conn }) => {
    const db = global.db.data
    const users = Object.values(db.users)
    
    const usage = (100 - (100 * _cpus().reduce((a, c) => a + c.times.idle, 0) / _cpus().reduce((a, c) => a + Object.values(c.times).reduce((x, y) => x + y, 0), 0))).toFixed(1) + '%'

    const system = `「✦」Estado de *${global.botname}*

❒ RAM [MAIN]: *${format(process.memoryUsage().rss)}*
❒ CPU (x${cpuLen}): *${usage}*
✿ Bots activos: *${global.conns.filter(c => c.user && c.ws?.socket?.readyState !== 3).length}*
✐ Comandos: *${toNum(users.reduce((a, u) => a + (u.commands || 0), 0))}*
❒ Usuarios: *${Object.keys(db.users).length.toLocaleString()}*
❒ Grupos: *${Object.keys(db.chats).length.toLocaleString()}*
❒ Plugins: *${Object.values(global.plugins).filter(v => v.help && v.tags).length}*

◤ Sistema:
    *✦ Plataforma:* ${plt} ${arch}
    *✦ RAM Total:* ${format(totalmem())}
    *✦ RAM Usada:* ${format(totalmem() - freemem())}
    *✦ Host:* ${host}...`

    await conn.sendMessage(m.chat, { text: system }, { quoted: m })
}

handler.help = ['estado']
handler.tags = ['main']
handler.command = ['estado', 'status']
handler.group = true

export default handler

function toNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
    return n.toString()
}
