const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

module.exports = async (client, m) => {
    const chat = m.key.remoteJid
    const message = m.message.extendedTextMessage?.contextInfo?.quotedMessage || m.message
    const isVideo = message.videoMessage || message.gifPlayback
    const isImage = message.imageMessage
    
    if (!isImage && !isVideo) return client.sendMessage(chat, { text: "❌ Umaru necesita una imagen, video o GIF." })

    try {
        const type = isVideo ? 'video' : 'image'
        const stream = await downloadContentFromMessage(isVideo || isImage, type)
        let buffer = Buffer.from([])
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

        const tmpDir = './temp'
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

        const tmpIn = path.join(tmpDir, `${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`)
        const tmpOut = path.join(tmpDir, `${Date.now()}.webp`)
        fs.writeFileSync(tmpIn, buffer)

        // Comando inteligente: 
        // - Si es imagen: escala y quita fondo/franjas.
        // - Si es video: corta a 6 seg (max WhatsApp), baja FPS a 12 y escala a 512px.
        const ffmpegCmd = isVideo 
            ? `ffmpeg -i ${tmpIn} -vcodec libwebp -fs 0.9M -filter_complex "[0:v] fps=12,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(512-iw)/2:(512-ih)/2:color=0x00000000,setsar=1" -loop 0 -preset default -an -vsync 0 ${tmpOut}`
            : `ffmpeg -i ${tmpIn} -vcodec libwebp -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(512-iw)/2:(512-ih)/2:color=0x00000000" ${tmpOut}`;

        exec(ffmpegCmd, async (err) => {
            if (err) return client.sendMessage(chat, { text: "❌ Error en conversión." })
            await client.sendMessage(chat, { sticker: fs.readFileSync(tmpOut) })
            if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn)
            if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut)
        })
    } catch (e) { console.error(e) }
}
