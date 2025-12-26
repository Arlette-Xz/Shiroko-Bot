import fs from 'fs'
import { WAMessageStubType } from '@whiskeysockets/baileys'

async function generarBienvenida({ conn, userId, groupMetadata, chat }) {
    const username = `@${userId.split('@')[0]}`
    const desc = groupMetadata?.desc?.toString() || 'Sin descripción'
    const subject = groupMetadata?.subject || 'Grupo'
    const mensaje = (chat.sWelcome || '૮꒰ ˶• ᴗ •˶꒱ა Disfruta tu estadía en el grupo!\n\n> ❍ Personaliza este mensaje usando: *:setwelcome*')
        .replace(/{usuario}/g, `${username}`)
        .replace(/{grupo}/g, `*${subject}*`)
        .replace(/{desc}/g, `${desc}`)
    
    const caption = `\`❏ BIENVENIDO/A\`\n──────────────────\n> ✰ *Grupo:* *${subject}*\n> ꕤ *Usuario:* ${username}\n> ✦ *Info:* Usa \`:help\` para ver los comandos\n\n> ❀ *Mensaje:*\n\n${mensaje}`

    let imageBuffer
    try {
        const profilePic = await conn.profilePictureUrl(userId, 'image').catch(() => null)
        if (profilePic) {
            const response = await fetch(profilePic)
            imageBuffer = Buffer.from(await response.arrayBuffer())
        } else {
            imageBuffer = global.welcomeConfig?.defaultAvatar
        }
    } catch {
        imageBuffer = global.welcomeConfig?.defaultAvatar
    }

    return { image: imageBuffer, caption, mentions: [userId] }
}

async function generarDespedida({ conn, userId, groupMetadata, chat }) {
    const username = `@${userId.split('@')[0]}`
    const desc = groupMetadata?.desc?.toString() || 'Sin descripción'
    const subject = groupMetadata?.subject || 'Grupo'
    const mensaje = (chat.sBye || '-1 Homosexual')
        .replace(/{usuario}/g, `${username}`)
        .replace(/{grupo}/g, `*${subject}*`)
        .replace(/{desc}/g, `*${desc}*`)
    
    const caption = `\`❏ ADIÓS\`\n──────────────────\n> ✰ *Grupo:* *${subject}*\n> ꕤ *Usuario:* ${username}\n> ✦ *Info:* Esperamos verte pronto\n\n> ❀ *Mensaje:*\n\n${mensaje}`

    let imageBuffer
    try {
        const profilePic = await conn.profilePictureUrl(userId, 'image').catch(() => null)
        if (profilePic) {
            const response = await fetch(profilePic)
            imageBuffer = Buffer.from(await response.arrayBuffer())
        } else {
            imageBuffer = global.welcomeConfig?.defaultAvatar
        }
    } catch {
        imageBuffer = global.welcomeConfig?.defaultAvatar
    }

    return { image: imageBuffer, caption, mentions: [userId] }
}

let handler = m => m
handler.before = async function (m, { conn, participants, groupMetadata }) {
    if (!m.messageStubType || !m.isGroup) return !0
    
    const chat = global.db.data.chats[m.chat]
    if (!chat) return !0
    
    const primaryBot = chat.primaryBot
    if (primaryBot && conn.user.jid !== primaryBot) return !1
    
    if (!groupMetadata) {
        groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    }
    if (!groupMetadata) return !0

    const userId = m.messageStubParameters[0]
    
    if (chat.welcome && m.messageStubType == WAMessageStubType.GROUP_PARTICIPANT_ADD) {
        const { image, caption, mentions } = await generarBienvenida({ conn, userId, groupMetadata, chat })
        if (global.rcanal && global.rcanal.contextInfo) {
            global.rcanal.contextInfo.mentionedJid = mentions
        }
        await conn.sendMessage(m.chat, { image: image, caption, ...global.rcanal }, { quoted: null })
    }
    
    if (chat.bye && (m.messageStubType == WAMessageStubType.GROUP_PARTICIPANT_REMOVE || m.messageStubType == WAMessageStubType.GROUP_PARTICIPANT_LEAVE)) {
        const { image, caption, mentions } = await generarDespedida({ conn, userId, groupMetadata, chat })
        if (global.rcanal && global.rcanal.contextInfo) {
            global.rcanal.contextInfo.mentionedJid = mentions
        }
        await conn.sendMessage(m.chat, { image: image, caption, ...global.rcanal }, { quoted: null })
    }
    return !0
}

export { generarBienvenida, generarDespedida }
export default handler
