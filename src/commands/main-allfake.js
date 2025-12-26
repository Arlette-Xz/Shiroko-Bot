import fs from 'fs'

var handler = m => m
handler.all = async function (m) { 
    global.idchannel = global.ch.ch1
    global.namechannel = global.canalNombre
    
    global.d = new Date(new Date + 3600000)
    global.locale = 'es'
    global.fecha = d.toLocaleDateString('es', {day: 'numeric', month: 'numeric', year: 'numeric'})
    global.tiempo = d.toLocaleString('en-US', {hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true})

    global.nombre = m.pushName || 'Usuario'
    global.packsticker = `┊ Shiroko Team\n⤷ https://github.com/Arlette-Xz\n\n┊INFO\n ⤷ speed3xz.bot.nu/soporte`
    global.packsticker2 = `┊Bot\n┊⤷${global.botname} \n\n┊Usuario:\n┊⤷${nombre}`
    
    const canalConfig = {
        newsletterJid: global.idchannel,
        serverMessageId: Math.floor(Math.random() * 1000),
        newsletterName: global.namechannel
    }

    global.rcanal = {
        contextInfo: {
            isForwarded: true,
            forwardingScore: 999,
            forwardedNewsletterMessageInfo: canalConfig
        }
    }

    global.rcanalw = {
        contextInfo: {
            isForwarded: true,
            forwardingScore: 999,
            forwardedNewsletterMessageInfo: canalConfig,
            externalAdReply: {
                title: global.namechannel,
                body: '',
                thumbnail: global.icono,
                mediaType: 1,
                sourceUrl: null
            }
        }
    }

    global.rcanalden2 = global.rcanal

    global.rcanalx = {
        contextInfo: {
            isForwarded: true,
            forwardingScore: 999,
            forwardedNewsletterMessageInfo: canalConfig,
            externalAdReply: {
                title: global.namechannel,
                body: '',
                thumbnail: global.icono,
                mediaType: 1,
                sourceUrl: null
            }
        }
    }

    global.rcanalr = {
        contextInfo: {
            isForwarded: true,
            forwardingScore: 999,
            forwardedNewsletterMessageInfo: canalConfig,
            externalAdReply: {
                title: global.namechannel,
                body: '',
                thumbnail: global.icono,
                mediaType: 1,
                sourceUrl: null
            }
        }
    }

    global.rcanalden = {
        contextInfo: {
            isForwarded: true,
            forwardingScore: 999,
            forwardedNewsletterMessageInfo: canalConfig,
            externalAdReply: {
                title: '🔓 Acceso No Permitido',
                body: '',
                thumbnail: global.icono,
                mediaType: 1,
                sourceUrl: null
            }
        }
    }

    global.rcanaldev = {
        contextInfo: {
            isForwarded: true,
            forwardingScore: 999,
            forwardedNewsletterMessageInfo: canalConfig,
            externalAdReply: {
                title: '🛠️ Dev',
                body: '',
                thumbnail: global.icono,
                mediaType: 1,
                sourceUrl: null
            }
        }
    }

    global.fkontak = { 
        key: { 
            participants: "0@s.whatsapp.net", 
            remoteJid: "status@broadcast", 
            fromMe: false, 
            id: "Halo" 
        }, 
        message: { 
            contactMessage: { 
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD` 
            }
        }, 
        participant: "0@s.whatsapp.net" 
    }
}

export default handler