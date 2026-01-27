process.title = 'umaru'
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const handler = require('./src/handler')
const os = require('os')

async function startUmaru() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const client = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ["Umaru-Bot", "Chrome", "1.0.0"]
    })

    // Monitor en la línea 1
    setInterval(() => {
        const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(2)
        const uptime = process.uptime()
        const h = Math.floor(uptime / 3600); const m = Math.floor((uptime % 3600) / 60); const s = Math.floor(uptime % 60)
        
        // \x1b[1;1H va a la línea 1. \x1b[K limpia la línea.
        process.stdout.write(`\x1b[s\x1b[1;1H\x1b[48;2;255;182;193m\x1b[38;2;255;255;255m ✨ UMARU DASHBOARD \x1b[0m 🕒 ${h}h ${m}m ${s}s | ⚡ RAM: ${ram}MB | 🖥️ CPU: ${(os.loadavg()[0]).toFixed(2)}% \x1b[K\x1b[u`)
    }, 1000)

    client.ev.on('creds.update', saveCreds)
    
    client.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect, qr } = u
        if (qr) { console.clear(); qrcode.generate(qr, { small: true }) }
        
        if (connection === 'open') {
            console.clear()
            // Imprimimos el logo a partir de la línea 3 para no chocar con el monitor
            process.stdout.write(`\n\n\x1b[38;2;255;182;193m  _    _ __  __          _____  _    _ 
 | |  | |  \\/  |   /\\   |  __ \\| |  | |
 | |  | | \\  / |  /  \\  | |__) | |  | |
 | |  | | |\\/| | / /\\ \\ |  _  /| |  | |
 | |__| | |  | |/ ____ \\| | \\ \\| |__| |
  \\____/|_|  |_/_/    \\_\\_|  \\_\\\\____/ 
            \x1b[38;2;173;216;230m✨ Runtime Edition ✨\x1b[0m\n\n\x1b[32m✔ Sistema Online. Esperando actividad...\x1b[0m\n`)
        }
        
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) startUmaru()
        }
    })

    client.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]; if (!m.message || m.key.fromMe) return
        handler(client, m)
    })
}

startUmaru().catch(e => {})
