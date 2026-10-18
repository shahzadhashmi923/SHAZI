import makeWASocket, { useMultiFileAuthState, makeCacheableSignalKeyStore, delay } from "@whiskeysockets/baileys"
import { promises as fs } from "fs"

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST");
  if (req.method === "OPTIONS") return res.status(200).end();

  const num = req.query.num || req.body?.num;
  if (!num) return res.status(400).json({ error: "Number required" });

  try {
    const { state, saveCreds } = await useMultiFileAuthState("/tmp/" + num);
    const sock = makeWASocket({
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, fs) },
      printQRInTerminal: false,
      browser: ["SHAZI-MD", "Chrome", "1.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    if (!sock.authState.creds.registered) {
      await delay(2000);
      let code = await sock.requestPairingCode(num);
      code = code?.match(/.{1,4}/g)?.join("-") || code;
      return res.json({ code: code });
    } else {
      return res.json({ error: "Already paired" });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: e.message });
  }
}
