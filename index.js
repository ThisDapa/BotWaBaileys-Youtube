const { makeWASocket, useMultiFileAuthState, downloadContentFromMessage } = require('@whiskeysockets/baileys')
const pino = require('pino')
const { createSticker, StickerTypes } = require('wa-sticker-formatter')

async function connectWhatsapp() {
    const auth = await useMultiFileAuthState("session");
    const socket = makeWASocket({
      printQRInTerminal: true,
      browser: ["DAPABOT", "", ""],
      auth: auth.state,
      logger: pino({ level: "silent" }),
    });
  
    socket.ev.on("creds.update", auth.saveCreds);
    socket.ev.on("connection.update", async ({ connection }) => {
      if (connection === "open") {
        console.log("BOT WHATSAPP SUDAH SIAP✅ -- BY DAPICODE!"); //memberitahu jika sudah connect
      } else if (connection === "close") {
        await connectWhatsapp(); //gunanya buat connect ulang
      }
    });

    socket.ev.on("messages.upsert", async ({ messages, type }) => {
        const chat = messages[0]
        const pesan = (chat.message?.extendedTextMessage?.text ?? chat.message?.ephemeralMessage?.message?.extendedTextMessage?.text ?? chat.message?.conversation)?.toLowerCase() || "";
        const command = pesan.split(" ")[0];

        switch (command) {
          case ".ping":
            await socket.sendMessage(chat.key.remoteJid, { text: "Hello World." }, { quoted: chat })
            await socket.sendMessage(chat.key.remoteJid, { text: "Hello World2." }) //buat tanpa quoted
            break;

          case ".h":
          case ".hidetag":
            
          const args = pesan.split(" ").slice(1).join(" ")

          if (!chat.key.remoteJid.includes("@g.us")) {
            await socket.sendMessage(chat.key.remoteJid, { text: "*Command ini hanya bisa di gunakan di grub!!*" }, { quoted: chat })
            return;
          }

          const metadata = await socket.groupMetadata(chat.key.remoteJid);
          const participants = metadata.participants.map((v) => v.id);

          socket.sendMessage(chat.key.remoteJid, {
            text: args,
            mentions: participants
          })

          break;
        }

        if (chat.message?.imageMessage?.caption == '.sticker' && chat.message?.imageMessage) {

          const getMedia = async (msg) => {
            const messageType = Object.keys(msg?.message)[0]
            const stream = await downloadContentFromMessage(msg.message[messageType], messageType.replace('Message', ''))
            let buffer = Buffer.from([])
            for await (const chunk of stream) {
              buffer = Buffer.concat([buffer, chunk])
            }

            return buffer
          }

          const mediaData = await getMedia(chat)
          const stickerOption = {
            pack: "DapaSticker",
            author: "DapiCode",
            type: StickerTypes.FULL,
            quality: 50
          }

          const generateSticker = await createSticker(mediaData, stickerOption);
          await socket.sendMessage(chat.key.remoteJid, { sticker: generateSticker }) //langsung cobaaa
        }
    })
}

connectWhatsapp()