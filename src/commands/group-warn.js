import db from '../../lib/database.js'

const handler = async (m, { conn, text, command, usedPrefix }) => {
    const ctxErr = (global.rcanalx || {})
    const ctxWarn = (global.rcanalw || {})
    const ctxOk = (global.rcanalr || {})
    
    try {
        let who
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            who = conn.decodeJid(m.mentionedJid[0])
        } else if (m.quoted) {
            who = conn.decodeJid(m.quoted.sender)
        } else if (text) {
            const mentionMatch = text.match(/@(\d+)/)
            if (mentionMatch) {
                who = conn.decodeJid(mentionMatch[1] + '@s.whatsapp.net')
            }
        }
        
        if (!who && ['warn', 'addwarn', 'advertencia', 'delwarn', 'unwarn'].includes(command)) {
            return conn.reply(m.chat, `ꕤ Menciona o cita a alguien.`, m, ctxErr)
        }

        const groupMetadata = await conn.groupMetadata(m.chat)
        const ownerGroup = conn.decodeJid(groupMetadata.owner || m.chat.split`-`[0] + '@s.whatsapp.net')
        const chatData = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
        const warnLimit = chatData.warnLimit || 3
        
        if (who) {
            if (!global.db.data.users[who]) global.db.data.users[who] = { warn: 0 }
        }

        switch (command) {
            case 'advertencia': 
            case 'warn': 
            case 'addwarn': {
                if (who === conn.user.jid) return conn.reply(m.chat, `ꕤ No puedo advertirme a mí mismo.`, m, ctxWarn)
                if (who === ownerGroup) return conn.reply(m.chat, `ꕤ No puedo advertir al dueño del grupo.`, m, ctxWarn)
                
                let motivo = text ? text.replace(/@\d+/g, '').trim() : 'Sin especificar'
                global.db.data.users[who].warn += 1
                const warnCount = global.db.data.users[who].warn
                
                await conn.reply(m.chat, `*@${who.split('@')[0]}* recibió una advertencia!\nMotivo: ${motivo}\n*Advertencias: ${warnCount}/${warnLimit}*`, m, { mentions: [who] })
                
                if (warnCount >= warnLimit) {
                    global.db.data.users[who].warn = 0
                    await conn.reply(m.chat, `ꕤ *@${who.split('@')[0]}* superó el límite de ${warnLimit} advertencias y será eliminado.`, m, { mentions: [who] })
                    await conn.groupParticipantsUpdate(m.chat, [who], 'remove')
                }
                break
            }
            
            case 'delwarn': 
            case 'unwarn': {
                if (global.db.data.users[who].warn <= 0) return conn.reply(m.chat, `ꕤ El usuario tiene 0 advertencias.`, m, ctxWarn)
                global.db.data.users[who].warn -= 1
                await conn.reply(m.chat, `ꕤ *@${who.split('@')[0]}* se le quitó una advertencia.\n*ADVERTENCIAS ${global.db.data.users[who].warn}/${warnLimit}*`, m, { mentions: [who] })
                break
            }
            
            case 'listadv': 
            case 'advlist': {
                const adv = Object.entries(global.db.data.users).filter(([jid, u]) => u.warn > 0)
                const list = `❀ Usuarios Advertidos\n\n*Total : ${adv.length}*\n${adv.map(([jid, u]) => `*●* @${jid.split`@`[0]} : *(${u.warn}/${warnLimit})*`).join('\n')}\n\n⚠︎ Límite: *${warnLimit}*`
                const pp = await conn.profilePictureUrl(m.chat, 'image').catch(() => 'https://files.catbox.moe/xr2m6u.jpg')
                await conn.sendFile(m.chat, pp, 'img.jpg', list, m, null, { mentions: conn.parseMention(list) })
                break
            }
            
            case 'setwarnlimit': {
                let limit = parseInt(text)
                if (!text || isNaN(limit)) return conn.reply(m.chat, `ꕤ Especifica un número.`, m, ctxErr)
                chatData.warnLimit = limit
                await conn.reply(m.chat, `ꕤ Nuevo límite: *${chatData.warnLimit}*`, m, ctxOk)
                break
            }
        }
    } catch (e) {
        conn.reply(m.chat, `ꕤ Error: ${e.message}`, m, ctxErr)
    }
}

handler.command = ['advertencia', 'warn', 'addwarn', 'delwarn', 'unwarn', 'listadv', 'advlist', 'setwarnlimit', 'warnlimit']
handler.group = handler.admin = handler.botAdmin = true

export default handler
