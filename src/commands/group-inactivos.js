import { areJidsSameUser } from '@whiskeysockets/baileys'

let handler = async (m, { conn, text, participants, command }) => {
    const ctxOk = (global.rcanalr || {})
    
    try {
        const limit = parseInt(text) || 100
        const usersData = global.db.data.users
        
        let list = participants.map(u => ({
            id: u.id,
            admin: u.admin || u.superadmin || false,
            msgs: usersData[u.id]?.chat || 0
        }))

        list.sort((a, b) => a.msgs - b.msgs)

        if (command.includes('kick')) {
            let kickables = list.filter(u => !u.admin && u.msgs < limit && !areJidsSameUser(u.id, conn.user.id))
            if (kickables.length === 0) return conn.reply(m.chat, `ꕤ No hay usuarios para eliminar con menos de ${limit} mensajes.`, m, ctxOk)

            let txt = `❀ *Limpieza de Inactivos*\n\n`
            txt += `> » Umbral: *${limit}* mensajes\n`
            txt += `> » Candidatos: *${kickables.length}*\n\n`
            txt += kickables.slice(0, 30).map((v, i) => `*#${i + 1}* @${v.id.split('@')[0]} [${v.msgs}]`).join('\n')
            
            await conn.reply(m.chat, txt, m, { mentions: kickables.map(u => u.id) })
            
            for (let u of kickables) {
                await conn.groupParticipantsUpdate(m.chat, [u.id], 'remove')
                await new Promise(r => setTimeout(r, 7000))
            }
        } else {
            let txt = `❀ *Lista de Actividad (Ascendente)* ❀\n\n`
            txt += list.map((v, i) => `${i + 1}. @${v.id.split('@')[0]} » *${v.msgs}* ${v.admin ? '〔Admin〕' : ''}`).join('\n')
            
            await conn.reply(m.chat, txt, m, { mentions: list.map(u => u.id) })
        }
    } catch (e) {
        console.error(e)
    }
}

handler.help = ['inactivos', 'kickinactivos']
handler.tags = ['grupo']
handler.command = ['inactivos', 'fantasmas', 'topinactive', 'kickinactivos', 'kickfantasmas']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
