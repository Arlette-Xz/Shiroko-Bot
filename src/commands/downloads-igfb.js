import fetch from 'node-fetch'

let handler = async (m, { args, conn, command }) => {
    if (!args[0]) return conn.reply(m.chat, `ꕤ Por favor, ingresa un enlace de Instagram o Facebook.`, m)

    try {
        const isIg = /ig|instagram/i.test(command)
        const endpoint = isIg ? 'instagram' : 'facebook'
        const apiDirecta = `https://api-nexy.ultraplus.click/api/dl/${endpoint}?url=${encodeURIComponent(args[0])}`
        
        const res = await fetch(apiDirecta)
        const json = await res.json()

        if (!json.status || !json.media || !Array.isArray(json.media)) {
            return conn.reply(m.chat, `ꕥ No se encontraron archivos en este enlace o el link es privado.`, m)
        }

        for (const item of json.media) {
            if (!item || !item.url) continue
            const isVideo = item.type === 'video'
            await conn.sendFile(m.chat, item.url, isVideo ? 'video.mp4' : 'image.jpg', `ꕤ Aquí tienes`, m)
        }

    } catch (error) {
        await m.reply(`⚠︎ Error al procesar la descarga:\n${error.message}`)
    }
}

handler.command = /^(instagram|ig|facebook|fb)$/i
handler.tags = ['descargas']
handler.help = ['instagram', 'ig', 'facebook', 'fb']
handler.group = true

export default handler
