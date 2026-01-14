let handler = async (m, { conn, text, participants }) => {
    const usersData = global.db.data.users
    const args = text.split(' ')
    
    let days = 7
    let page = 1
    
    if (args.length === 1) {
        let val = parseInt(args[0])
        if (val > 100) days = val // Si es un numero alto, son dias
        else page = val || 1 // Si es bajo, es pagina
    } else if (args.length >= 2) {
        days = parseInt(args[0]) || 7
        page = parseInt(args[1]) || 1
    }

    const pageSize = 10
    let list = participants.map(u => {
        const user = usersData[u.id] || {}
        return {
            id: u.id,
            name: user.name || conn.getName(u.id) || u.id.split('@')[0],
            msgs: user.chat || 0,
            cmds: user.commands || 0
        }
    }).filter(u => u.msgs > 0) // Solo filtramos que tengan al menos 1 mensaje

    list.sort((a, b) => b.msgs - a.msgs)

    const totalPages = Math.ceil(list.length / pageSize)
    if (list.length === 0) return conn.reply(m.chat, `ꕤ No hay registros de mensajes en este grupo.`, m)
    if (page > totalPages) page = totalPages

    const start = (page - 1) * pageSize
    const paginatedItems = list.slice(start, start + pageSize)

    let txt = `❀ Top de mensajes de los últimos *${days}* días\n\n`
    txt += paginatedItems.map((v, i) => {
        let nom = v.name.replace(/@/g, '').replace(/\n/g, ' ').trim()
        return `*#${start + i + 1} » ${nom}*\n\t\t» Mensajes: \`${v.msgs}\`, Comandos: \`${v.cmds}\``
    }).join('\n')

    txt += `\n\n> Página: *${page}* de *${totalPages}*`
    txt += `\n> Usa: *.topcount ${days} ${page + 1}*`

    await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
}

handler.help = ['topcount [días] [página]']
handler.tags = ['grupo']
handler.command = ['topcount', 'topinactivos', 'ranking']
handler.group = true

export default handler
