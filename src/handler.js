const sticker = require('./plugins/sticker')
const axios = require('axios')

// AHORA POR DEFECTO ESTÁ APAGADA (false)
let chatActive = false 

module.exports = async (client, m) => {
    const chat = m.key.remoteJid
    const isGroup = chat.endsWith('@g.us')
    const pushName = m.pushName || 'valedor'
    const text = (m.message.conversation || m.message.extendedTextMessage?.text || "").trim()
    const command = text.toLowerCase().split(' ')[0]
    const botNumber = client.user.id.split(':')[0]
    
    // CONTROL DE LA IA
    if (command === '.umaru') {
        const mode = text.split(' ')[1]
        if (mode === 'on') { 
            chatActive = true
            return client.sendMessage(chat, { text: '🔥 ¡Ya rugiste, carnal! Umaru está en la casa. ¿Qué transa con la banda?' })
        }
        if (mode === 'off') { 
            chatActive = false
            return client.sendMessage(chat, { text: '💤 Cámara, me voy a dormir un rato. Ahí me hablas si ocupas stickers.' })
        }
    }

    // COMANDOS SIEMPRE ACTIVOS
    if (command === '.ping') return await client.sendMessage(chat, { text: '¡Al tiro y sin falla! 😎' })
    if (command === '.s' || command === '.sticker') return await sticker(client, m)

    // LÓGICA DEL HABLA (SOLO SI SE ACTIVA CON .umaru on)
    const isMentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.includes(client.user.id) || text.includes(botNumber)
    const isReplyToMe = m.message.extendedTextMessage?.contextInfo?.participant?.includes(botNumber)

    if (chatActive && !m.key.fromMe && (isMentioned || isReplyToMe || !isGroup)) {
        if (text.length < 2) return
        try {
            const response = await axios.get(`https://api.vyturex.com/rewrite?text=${encodeURIComponent("Eres una mujer chola de CDMX, ruda y breve. Responde a: " + text)}`, { timeout: 5000 });
            let cholaRes = response.data.result;
            if (cholaRes) {
                await client.sendMessage(chat, { text: `🔥 ${cholaRes}` }, { quoted: m });
            }
        } catch (e) {
            // Si la IA falla, lanzamos una frase de barrio para no quedar mal
            const fallos = [
                "¡Chale! No te oigo, carnal, hay mucha interferencia.",
                "Cámara, valedor... luego te sigo el chisme.",
                "Simón, simón... pero ahorita ando ocupada cuidando el punto."
            ];
            const random = fallos[Math.floor(Math.random() * fallos.length)];
            await client.sendMessage(chat, { text: `🔥 ${random}` }, { quoted: m });
        }
    }
}
