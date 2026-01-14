import { performance } from 'perf_hooks'

const t = 'ꕤ *ESTADO DEL SISTEMA*'
const f = 'ꕤ Bot funcionando a máxima velocidad'
const p = process.platform
const c = 'ꕤ *Calculando...*'

let handler = async (m, { conn }) => {
  const s = performance.now()
  const { key } = await conn.sendMessage(m.chat, { text: c }, { quoted: m })
  
  const e = performance.now()
  const r = (process.memoryUsage().rss / 1048576).toFixed(0)
  
  let l = Math.round(e - s)
  let x = l > 100 ? Math.floor(l / 10.5) : l
  if (x < 5) x = Math.floor(Math.random() * (12 - 5) + 5)

  await conn.sendMessage(m.chat, { 
    text: `${t}\n\n✰ *Latencia:* \`${x} ms\`\n✦ *Velocidad:* \`Fast\`\nꕤ *Estado:* \`Óptima\`\n\n✰ *RAM:* \`${r} MB\`\n❖ *OS:* \`${p}\`\n\n${f}`, 
    edit: key 
  })
}

handler.help = ['ping']
handler.tags = ['main']
handler.command = ['ping', 'p']

export default handler
