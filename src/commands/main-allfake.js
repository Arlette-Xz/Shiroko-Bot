import fs from 'fs'

const getCanalConfig = () => ({
    newsletterJid: global.idchannel || global.ch?.ch1,
    serverMessageId: Math.floor(Math.random() * 1000),
    newsletterName: global.namechannel || global.canalNombre
})

var handler = m => m
handler.all = async function (m) { 
    const d = new Date(Date.now() + 3600000)
    global.nombre = m.pushName || 'Usuario'
    
    global.fecha = d.toLocaleDateString('es', {day: 'numeric', month: 'numeric', year: 'numeric'})
    global.tiempo = d.toLocaleString('en-US', {hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true})

    global.packsticker = `┊ Shiroko Team\n⤷ https://github.com/Arlette-Xz\n\n┊INFO\n ⤷ speed3xz.bot.nu/soporte`
    global.packsticker2 = `┊Bot\n┊⤷${global.botname} \n\n┊Usuario:\n┊⤷${global.nombre}`

    const canalConfig = getCanalConfig()
    const baseContext = {
        isForwarded: true,
        forwardingScore: 999,
        forwardedNewsletterMessageInfo: canalConfig
    }

    const baseAdReply = (title) => ({
        contextInfo: {
            ...baseContext,
            externalAdReply: {
                title: title,
                body: '',
                thumbnail: global.icono,
                mediaType: 1,
                sourceUrl: null
            }
        }
    })

    global.rcanal = { contextInfo: baseContext }
    global.rcanalw = baseAdReply(global.namechannel)
    global.rcanalx = global.rcanalw 
    global.rcanalr = global.rcanalw
    global.rcanalden = baseAdReply('🔓 Acceso No Permitido')
    global.rcanaldev = baseAdReply('🛠️ Dev')

    const userJid = m.sender.split('@')[0]
    global.fkontak = { 
        key: { participants: "0@s.whatsapp.net", remoteJid: "status@broadcast", fromMe: false, id: "Halo" }, 
        message: { contactMessage: { vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${userJid}:${userJid}\nitem1.X-ABLabel:Ponsel\nEND:VCARD` }}, 
        participant: "0@s.whatsapp.net" 
    }
}

export default handler
