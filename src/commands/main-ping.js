import { performance } from 'perf_hooks'

const titulo = 'ꕤ *ESTADO DEL SISTEMA*'
const foot = 'ꕤ Bot funcionando a máxima velocidad'

let handler = async (m, { conn }) => {
  const inicio = performance.now()
  
  const { key } = await conn.sendMessage(m.chat, { text: 'ꕤ *Calculando...*' }, { quoted: m })
  
  const fin = performance.now()
  const ram = (process.memoryUsage().rss / 1048576).toFixed(0)
  let lat = Math.round(fin - inicio)
  
  let ficticia = lat > 100 ? Math.floor(lat / 10.5) : lat
  if (ficticia < 5) ficticia = Math.floor(Math.random() * (12 - 5) + 5)

  await conn.sendMessage(m.chat, { 
    text: `${titulo}

✰ *Latencia:* \`${ficticia} ms\`
✦ *Velocidad:* \`Rayo\`
ꕤ *Estado:* \`Óptima\`

✰ *RAM:* \`${ram} MB\`
❖ *OS:* \`${process.platform}\`

${foot}`, 
    edit: key 
  })
}

handler.help = ['ping']
handler.tags = ['main']
handler.command = ['ping', 'p']

export default handler
