import ws from 'ws'

const handler = async (m, { conn, usedPrefix }) => {
  const ctxErr = (global.rcanalx || {})
  
  try {
    const activeSubBots = (global.conns || [])
      .filter(c => c.user && c.ws?.socket?.readyState !== ws.CLOSED)
      .map(c => conn.decodeJid(c.user.jid))

    const allBots = [...new Set([...activeSubBots, conn.decodeJid(conn.user.jid)])]
    
    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false
    if (!who) return conn.reply(m.chat, `ꕤ Menciona o cita a un Bot para configurarlo como principal.`, m, ctxErr)
    
    who = conn.decodeJid(who)
    
    if (!allBots.includes(who)) {
      return conn.reply(m.chat, `ꕤ El usuario @${who.split('@')[0]} no es un Socket activo en este momento.`, m, { mentions: [who] })
    }
    
    const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
    
    if (chat.primaryBot === who) {
      return conn.reply(m.chat, `ꕤ @${who.split('@')[0]} ya es el Bot principal aquí.`, m, { mentions: [who] })
    }
    
    chat.primaryBot = who
    await conn.reply(m.chat, `ꕤ Listo. Se ha establecido a @${who.split('@')[0]} como Bot primario.\n> Todos los comandos serán respondidos por este Socket.`, m, { mentions: [who] })

  } catch (e) {
    conn.reply(m.chat, `ꕤ Error: ${e.message}`, m)
  }
}

handler.help = ['setprimary']
handler.tags = ['grupo']
handler.command = ['setprimary']
handler.group = true
handler.admin = true

export default handler
