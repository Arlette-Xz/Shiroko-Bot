import { execSync } from 'child_process'

var handler = async (m, { conn, text, isROwner }) => {
    if (!isROwner) return
    
    try {
        const stdout = execSync('git pull' + (m.fromMe && text ? ' ' + text : ''));
        let output = stdout.toString().trim();

        if (output.includes('Already up to date.')) {
            return conn.reply(m.chat, 'ꕤ Actualización lista.', m)
        }

        if (output.includes('Updating')) {
            const lines = output.split('\n');
            
            // Filtrar y formatear la lista de archivos
            const files = lines
                .filter(line => line.includes('|') && !line.includes('files changed'))
                .map(line => `> ✰ ${line.split('|')[0].trim()}`)
                .join('\n');

            // Extraer cantidad de archivos cambiados
            const stats = lines.find(line => line.includes('changed'));
            const changedCount = stats ? stats.match(/\d+/g)[0] : '0';

            const message = `\`❏ Actualización\`\n──────────────────\n\n*ꕤ Lista de Archivos*\n${files}\n\n*ꕤ Cambios Totales: ${changedCount}*\n\n> By *Shiroko*`
            
            return conn.reply(m.chat, message, m)
        }

        conn.reply(m.chat, output, m)

    } catch (e) { 
        try {
            const status = execSync('git status --porcelain')
            if (status.length > 0) {
                const conflictedFiles = status.toString().split('\n')
                    .filter(line => line.trim() !== '')
                    .map(line => {
                        if (line.match(/\.npm\/|\.cache\/|tmp\/|database\.json|sessions\/|npm-debug\.log/)) return null
                        return '*→ ' + line.slice(3) + '*'
                    }).filter(Boolean)

                if (conflictedFiles.length > 0) {
                    const errorMessage = `\`⚠︎ No se pudo realizar la actualización:\`\n\n> *Se han encontrado cambios locales en los archivos del bot que entran en conflicto.*\n\n${conflictedFiles.join('\n')}`
                    return conn.reply(m.chat, errorMessage, m)
                }
            }
        } catch (error) {
            console.error(error)
            let errorMessage2 = '⚠︎ Ocurrió un error inesperado.'
            if (error.message) errorMessage2 += '\n⚠︎ Mensaje de error: ' + error.message
            await conn.reply(m.chat, errorMessage2, m)
        }
    }
}

handler.help = ['update']
handler.tags = ['owner']
handler.command = ['update', 'fix', 'actualizar', 'up']

export default handler
