const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { number } = req.query;
    if (!number) return res.status(400).json({ error: "Number do" });
    try {
        const { state, saveCreds } = await useMultiFileAuthState(`/tmp/${number}`);
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            browser: ["SHAZI-XMD", "Chrome", "1.0.0"]
        });
        if (!sock.authState.creds.registered) {
            await delay(2000);
            const code = await sock.requestPairingCode(number);
            return res.json({ code: code });
        }
        sock.ev.on("creds.update", saveCreds);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
