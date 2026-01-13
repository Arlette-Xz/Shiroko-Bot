const handler = async (m, { args, conn, usedPrefix }) => {
try {
if (!args[0]) return conn.reply(m.chat, `ꕤ Por favor, ingresa un enlace de Instagram/Facebook.`, m)
let data = []
try {
const isFacebook = args[0].includes('facebook.com') || args[0].includes('fb.watch')
const isInstagram = args[0].includes('instagram.com')
let api = ''
if (isFacebook) api = `https://api-nexy.ultraplus.click/api/dl/facebook?url=${encodeURIComponent(args[0])}`
if (isInstagram) api = `https://api-nexy.ultraplus.click/api/dl/instagram?url=${encodeURIComponent(args[0])}`
if (api) {
const res = await fetch(api)
const json = await res.json()
if (json.status === 'success' && json.result) {
if (json.result.hd || json.result.sd) data = [json.result.hd || json.result.sd]
else if (json.result.url) data = [json.result.url]
else if (json.result.media) data = Array.isArray(json.result.media) ? json.result.media.map(item => item.url || item) : [json.result.media]
}}} catch {}
if (!data.length) {
try {
const isFacebook = args[0].includes('facebook.com') || args[0].includes('fb.watch')
const isInstagram = args[0].includes('instagram.com')
let api = ''
if (isFacebook) api = `https://api-nexy.ultraplus.click/api/dl/facebook?url=${encodeURIComponent(args[0])}`
if (isInstagram) api = `https://api-nexy.ultraplus.click/api/dl/instagram?url=${encodeURIComponent(args[0])}`
if (api) {
const res = await fetch(api)
const json = await res.json()
if (json.status === 'success' && json.result) {
if (json.result.hd || json.result.sd) data = [json.result.hd || json.result.sd]
else if (json.result.url) data = [json.result.url]
else if (json.result.media) data = Array.isArray(json.result.media) ? json.result.media.map(item => item.url || item) : [json.result.media]
}}} catch {}
}
if (!data.length) return conn.reply(m.chat, `ꕥ No se pudo obtener el contenido.`, m)
for (let media of data) {
const extension = media.includes('.jpg') || media.includes('.png') || media.includes('.webp') ? 'jpg' : 'mp4'
const filename = `instagram.${extension}`
await conn.sendFile(m.chat, media, filename, `ꕤ Aquí tienes`, m)
}} catch (error) {
await m.reply(`⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${error.message}`)
}}

handler.command = ['instagram', 'ig', 'facebook', 'fb']
handler.tags = ['descargas']
handler.help = ['instagram', 'ig', 'facebook', 'fb']
handler.group = true

export default handler
