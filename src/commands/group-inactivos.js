import { areJidsSameUser } from '@whiskeysockets/baileys'

let handler = async (m, { conn, text, participants, command, usedPrefix }) => {
    const usersData = global.db.data.users
    const args = text.split(' ')
    const days = args[0] && parseInt(args[0]) > 20 ? parseInt(args[0]) : 7
    const page = args[1] ? parseInt(args[1]) : (parseInt(args[0]) <= 20 ? parseInt(args[0]) || 1 : 1)
    const pageSize = 10

    let list = participants.map(u => {
        const user = usersData[u.id] || {}
        const name = user.mName || user.name || conn.getName(u.id) || u.id.split('@')[0]
        return {
            id: u.id,
            name: name,
            cmds: user.commands || user.commandCount || 0,
            admin: u.admin || u.superadmin || false
        }
    })

    if (command === 'topcount' || command === 'ranking') {
        list.sort((a, b) => b.cmds - a.cmds)
        const totalPages = Math.ceil(list.length / pageSize)
        const start = (Math.min(page, totalPages) - 1) * pageSize
        const items = list.slice(start, start + pageSize)

        let txt = `❀ Top de comandos de los últimos *${days}* días\n\n`
        txt += items.map((v, i) => `*#${start + i + 1} » ${v.name.replace(/\n/g, ' ')}*\n\t\t» Comandos: \`${v.cmds}\``).join('\n')
        txt += `\n\n> Página: *${page}* de *${totalPages}*\n> Usa: *${usedPrefix}${command} ${days} ${page + 1}*`
        return await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
    }

    if (command === 'fantasmas' || command === 'inactivos' || command === 'topinactive') {
        let inactivos = list.filter(u => u.cmds < 5 && !u.admin && !areJidsSameUser(u.id, conn.user.id))
        inactivos.sort((a, b) => a.cmds - b.cmds)
        
        if (inactivos.length === 0) return conn.reply(m.chat, `ꕤ No se encontraron fantasmas en este grupo.`, m)

        const totalPages = Math.ceil(inactivos.length / pageSize)
        const start = (Math.min(page, totalPages) - 1) * pageSize
        const items = inactivos.slice(start, start + pageSize)

        let txt = `❀ Lista de inactivos/fantasmas\n\n`
        txt += `> » Umbral: Menos de 5 comandos\n`
        txt += `> » Total: ${inactivos.length} usuarios\n\n`
        txt += items.map((v, i) => `*#${start + i + 1} » ${v.name.replace(/\n/g, ' ')}*\n\t\t» Comandos: \`${v.cmds}\``).join('\n')
        txt += `\n\n> Página: *${page}* de *${totalPages}*\n> Usa: *${usedPrefix}${command} ${days} ${page + 1}*`
        
        return await conn.sendMessage(m.chat, { text: txt, mentions: items.map(u => u.id) }, { quoted: m })
    }
}

handler.help = ['topcount', 'fantasmas', 'inactivos', 'topinactive']
handler.tags = ['grupo']
handler.command = ['topcount', 'fantasmas', 'inactivos', 'topinactive', 'ranking']
handler.group = true

export default handler
