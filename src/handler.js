const sticker = require('./plugins/sticker')
const { exec } = require('child_process')
const axios = require('axios')

module.exports = async (client, m) => {
    const chat = m.key.remoteJid
    const text = (m.message.conversation || m.message.extendedTextMessage?.text || "").trim()
    
    // 1. EJECUTOR MAESTRO ($)
    if (text.startsWith('$')) {
        if (!m.key.fromMe) return 
        const terminalCommand = text.slice(1).trim()
        exec(terminalCommand, (error, stdout) => {
            client.sendMessage(chat, { text: stdout || 'Ejecutado (sin salida).' })
        })
        return
    }

    const command = text.toLowerCase().split(' ')[0]

    // 2. STICKERS Y PING
    if (command === '.ping') return await client.sendMessage(chat, { text: '¡Al tiro! ⚡' })
    if (command === '.s' || command === '.sticker') return await sticker(client, m)

    // 3. IA (Con filtro de errores para evitar el 404)
    const isMentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.includes(client.user.id)
    const isPrivate = !chat.endsWith('@g.us')

    if (!m.key.fromMe && (isMentioned || isPrivate) && text.length > 2) {
        try {
            // Usamos una nueva URL de respaldo (Luminai o similar)
            const response = await axios.get(`https://pod02.vyturex.com/search/rv?q=${encodeURIComponent("Responde ruda y breve: " + text)}`)
            
            // Si la API responde bien, mandamos el mensaje
            if (response.data && response.data.answer) {
                await client.sendMessage(chat, { text: `🔥 ${response.data.answer}` }, { quoted: m })
            }
        } catch (e) {
            // Si la IA falla, que no haga nada y no ensucie la consola
            console.log("IA temporalmente fuera de servicio.")
        }
    }
}
