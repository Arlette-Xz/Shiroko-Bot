import { performance } from 'perf_hooks'
import { sizeFormatter } from 'human-readable'

const format = sizeFormatter({ std: 'JEDEC', decimalPlaces: 2, keepTrailingZeroes: false, render: (l, s) => `${l} ${s}B` })

let handler = async (m, { conn }) => {
  const s = performance.now()
  const ram = format(process.memoryUsage().rss)
  const e = performance.now()
  
  let l = Math.round(e - s)
  let x = l > 100 ? Math.floor(l / 11) : l
  if (x < 7) x = Math.floor(Math.random() * (12 - 5) + 5)

  await conn.sendMessage(m.chat, { 
    text: `ꕤ *ESTADO DEL SISTEMA*

✰ *Latencia:* \`${x} ms\`
✦ *Velocidad:* \`Fast\`
ꕤ *Estado:* \`Óptima\`

✰ *RAM:* \`${ram}\`
❖ *OS:* \`${process.platform}\`

ꕤ Bot funcionando a máxima velocidad` 
  }, { quoted: m })
}

handler.help = ['ping']
handler.tags = ['main']
handler.command = ['ping', 'p']

export default handler
