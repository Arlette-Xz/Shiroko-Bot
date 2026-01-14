import { cpus as _cpus, totalmem, freemem, platform, hostname } from 'os'
import { sizeFormatter } from 'human-readable'

const format = sizeFormatter({ std: 'JEDEC', decimalPlaces: 2, keepTrailingZeroes: false, render: (literal, symbol) => `${literal} ${symbol}B` })
const arch = process.arch
const plt = platform()
const host = hostname().slice(0, 8)
const cpuLen = _cpus().length

let handler = async (m, { conn }) => {
    const [totalUsers, totalChats, totalPlugins] = [
        Object.keys(global.db.data.users).length,
        Object.keys(global.db.data.chats).length,
        Object.values(global.plugins).filter((v) => v.help && v.tags).length
    ]

    const totalBots = global.conns.filter(c => c.user && c.ws?.socket?.readyState !== 3).length
    const totalCommands = Object.values(global.db.data.users).reduce((acc, u) => acc + (u.commands || 0), 0)
    
    const cpuIdle = _cpus().reduce((acc, cpu) => acc + cpu.times.idle, 0)
    const cpuTick = _cpus().reduce((acc, cpu) => acc + Object.values(cpu.times).reduce((a, b) => a + b, 0), 0)
    const usage = (100 - (100 * cpuIdle / cpuTick)).toFixed(1) + '%'

    const system = `「✦」Estado de *${global.botname}*

❒ RAM [MAIN]: *${format(process.memoryUsage().rss)}*
❒ CPU (x${cpuLen}): *${usage}*
✿ Bots activos: *${totalBots}*
✐ Comandos: *${toNum(totalCommands)}*
❒ Usuarios: *${totalUsers.toLocaleString()}*
❒ Grupos: *${totalChats.toLocaleString()}*
❒ Plugins: *${totalPlugins}*

◤ Sistema:
    *✦ Plataforma:* ${plt} ${arch}
    *✦ RAM Total:* ${format(totalmem())}
    *✦ RAM Usada:* ${format(totalmem() - freemem())}
    *✦ Host:* ${host}...`

    await conn.reply(m.chat, system, m, (global.rcanalr || {}))
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
