import fetch from 'node-fetch'
import { lookup } from 'mime-types'

let handler = async (m, { conn, text, usedPrefix }) => {
    if (!text) return conn.reply(m.chat, 'ꕤ Te faltó el enlace de Mediafire.', m)
    if (!/^https:\/\/www\.mediafire\.com\//i.test(text)) return conn.reply(m.chat, 'ꕤ Enlace inválido.', m)

    try {
        const api = `https://api-nexy.ultraplus.click/api/dl/mediafire?url=${encodeURIComponent(text)}`
        const res = await fetch(api)
        const json = await res.json()

        if (!json.status || !json.result || !json.result.files || json.result.files.length === 0) {
            throw new Error('No se pudo obtener el archivo.')
        }

        const file = json.result.files[0]
        const filename = file.name
        const filesize = file.size
        const dl_url = file.download
        const extension = filename.split('.').pop()
        const mimetype = lookup(extension) || 'application/octet-stream'

        const caption = `乂  MEDIAFIRE - DESCARGA  乂\n\n✩ *Nombre »* ${filename}\n✩ *Peso »* ${filesize}\n✩ *MimeType »* ${mimetype}\n✩ *Enlace »* ${text}`

        await conn.sendMessage(m.chat, { 
            document: { url: dl_url }, 
            fileName: filename, 
            mimetype, 
            caption 
        }, { quoted: m })

    } catch (e) {
        return conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n\n${e.message}`, m)
    }
}

handler.command = ['mf', 'mediafire']
handler.help = ['mediafire']
handler.tags = ['descargas']
handler.group = true
handler.premium = true

export default handler
