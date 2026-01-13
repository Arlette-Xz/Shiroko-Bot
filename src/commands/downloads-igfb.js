import fetch from 'node-fetch'

let handler = async (m, { args, conn, usedPrefix, command }) => {
    if (!args[0]) return conn.reply(m.chat, `ꕤ Por favor, ingresa un enlace de Instagram o Facebook.`, m)

    try {
        const isIg = /ig|instagram/.test(command)
        const apiType = isIg ? 'instagram' : 'facebook'
        const nexyApi = `${global.APIs.nexy.url}/api/dl/${apiType}?url=${encodeURIComponent(args[0])}`
        
        const res = await fetch(nexyApi)
        const json = await res.json()

        if (!json.status || !json.media) {
            return conn.reply(m.chat, `ꕥ No se pudo obtener el contenido. Verifica el enlace.`, m)
        }

        for (let item of json.media) {
            const isVideo = item.type === 'video'
            await conn.sendFile(m.chat, item.url, isVideo ? 'video.mp4' : 'image.jpg', `ꕤ Aquí tienes`, m)
        }

    } catch (error) {
        await m.reply(`⚠︎ Se ha producido un problema.\n\n${error.message}`)
    }
}

handler.command = ['instagram', 'ig', 'facebook', 'fb']
handler.tags = ['descargas']
handler.help = ['instagram', 'ig', 'facebook', 'fb']
handler.group = true

export default handler
