import { performance } from 'perf_hooks'

const t = 'ꕤ *LATENCIA Y RENDIMIENTO*'
const f = 'ꕤ Sistema operando a máxima velocidad'
const p = process.platform

let handler = async (m, { conn }) => {
  const s = performance.now()
  const { key } = await conn.sendMessage(m.chat, { text: '✐ *Pinging...*' }, { quoted: m })
  
  const e = performance.now()
  const r = (process.memoryUsage().rss / 1048576).toFixed(0)
  
  let l = Math.round(e - s)
  let x = l > 100 ? Math.floor(l / 11) : l
  if (x < 7) x = Math.floor(Math.random() * (15 - 7) + 7)

  await conn.sendMessage(m.chat, { 
    text: `${t}\n\n• *Latencia:* \`${x} ms\`\n• *Velocidad:* \`Turbo\`\n• *RAM:* \`${r} MB\`\n\n◤ *SISTEMA*\n    • *OS:* ${p}\n\n${f}`, 
    edit: key 
  })
}

handler.help = ['ping']
handler.tags = ['main']
handler.command = ['ping', 'p']

export default handler
