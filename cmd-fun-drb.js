// ضرب.js - أمر ضرب متكامل
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const globalStickerPath = path.join(__dirname, 'db-global_hit_sticker.json');

if (!fs.existsSync(path.dirname(globalStickerPath))) {
  fs.mkdirSync(path.dirname(globalStickerPath), { recursive: true });
}

function loadSticker() {
  try {
    if (!fs.existsSync(globalStickerPath)) return {};
    return JSON.parse(fs.readFileSync(globalStickerPath));
  } catch {
    return {};
  }
}

function saveSticker(data) {
  fs.writeFileSync(globalStickerPath, JSON.stringify(data, null, 2));
}

async function getStickerBuffer(quoted) {
  try {
    const stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker');
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
  } catch (error) {
    throw new Error('فشل تحميل الملصق: ' + error.message);
  }
}

function extractJid(msg, chatId) {
  const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
  let who = null;

  if (contextInfo.mentionedJid && contextInfo.mentionedJid.length > 0) {
    const validJids = contextInfo.mentionedJid.filter(jid => jid !== chatId);
    if (validJids.length > 0) {
      who = validJids[0];
    }
  }

  if (!who && contextInfo.quotedMessage) {
    who = contextInfo.participant || contextInfo.quotedMessage?.key?.participant;
  }

  if (!who) {
    const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const mentionMatch = fullText.match(/@(\d+)/);
    if (mentionMatch) {
      who = `${mentionMatch[1]}@s.whatsapp.net`;
    }
  }

  return who;
}

async function getDisplayName(sock, jid, chatId) {
  if (!jid) return 'شخص';

  try {
    let cleanJid = jid;
    if (cleanJid.startsWith('lid:')) cleanJid = cleanJid.replace('lid:', '');
    if (cleanJid.includes('@')) cleanJid = cleanJid.split('@')[0];

    if (chatId && chatId.endsWith('@g.us')) {
      try {
        const groupMeta = await sock.groupMetadata(chatId);
        const participant = groupMeta.participants.find(p => p.id === jid);
        if (participant) {
          if (participant.name) return participant.name;
          if (participant.notify) return participant.notify;
          if (participant.shortName) return participant.shortName;
        }
      } catch (e) {}
    }

    if (sock.contacts && sock.contacts[jid]) {
      const contact = sock.contacts[jid];
      if (contact.name) return contact.name;
      if (contact.notify) return contact.notify;
      if (contact.shortName) return contact.shortName;
    }

    if (typeof sock.getName === 'function') {
      try {
        const name = await sock.getName(jid);
        if (name) return name;
      } catch (e) {}
    }

    return cleanJid || 'شخص';
  } catch (error) {
    let cleanJid = jid;
    if (cleanJid.startsWith('lid:')) cleanJid = cleanJid.replace('lid:', '');
    if (cleanJid.includes('@')) cleanJid = cleanJid.split('@')[0];
    return cleanJid || 'شخص';
  }
}

module.exports = {
  name: 'ضرب',
  command: ['ضرب'],
  description: '👊 ضرب شخص (مزاح)',
  category: 'تسلية',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    try {
      const sender = msg.key.participant || msg.key.remoteJid;

      await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });

      const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      const args = fullText.trim().split(/\s+/);
      const subCommand = args[1]?.toLowerCase() || '';

      if (subCommand === 'حفظ' || subCommand === 'save') {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted || !quoted.stickerMessage) {
          await sock.sendMessage(chatId, {
            text: `📌 حفظ ملصق الضرب\n━━━━━━━━━━━━━━━━━━━━\n❌ يجب الرد على ملصق (ستيكر)\n📝 .ضرب حفظ (رد على ملصق)\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
          }, { quoted: msg });
          await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
          return;
        }

        let stickerBuffer;
        try {
          stickerBuffer = await getStickerBuffer(quoted);
        } catch (error) {
          await sock.sendMessage(chatId, {
            text: `❌ فشل تحميل الملصق: ${error.message}`
          }, { quoted: msg });
          await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
          return;
        }

        if (!stickerBuffer || stickerBuffer.length < 100) {
          await sock.sendMessage(chatId, {
            text: '❌ الملصق فارغ أو تالف، حاول مرة أخرى.'
          }, { quoted: msg });
          await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
          return;
        }

        const stickerData = loadSticker();
        stickerData['global'] = {
          sticker: stickerBuffer.toString('base64'),
          savedBy: sender,
          savedAt: Date.now()
        };
        saveSticker(stickerData);

        const displayName = await getDisplayName(sock, sender, chatId);
        await sock.sendMessage(chatId, {
          text: `✅ تم حفظ ملصق الضرب عاماً!\n━━━━━━━━━━━━━━━━━━━━\n📌 استخدم .ضرب @منشن للإرسال\n👤 بواسطة: ${displayName}\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`,
          contextInfo: { mentionedJid: [sender] }
        }, { quoted: msg });
        await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
        return;
      }

      let who = extractJid(msg, chatId);

      if (!who) {
        await sock.sendMessage(chatId, {
          text: `👊 أمر ضرب\n━━━━━━━━━━━━━━━━━━━━\n❌ يجب منشن الشخص المطلوب\n📝 .ضرب @منشن\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
        }, { quoted: msg });
        await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
        return;
      }

      if (who === sender) {
        await sock.sendMessage(chatId, {
          text: `❌ لا يمكنك ضرب نفسك!`
        }, { quoted: msg });
        await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
        return;
      }

      if (who === chatId) {
        await sock.sendMessage(chatId, {
          text: `❌ لا يمكنك ضرب المجموعة!`
        }, { quoted: msg });
        await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
        return;
      }

      const stickerData = loadSticker();
      const savedSticker = stickerData['global'];

      if (!savedSticker) {
        await sock.sendMessage(chatId, {
          text: `❌ لا يوجد ملصق ضرب محفوظ.\n📌 قم بحفظ ملصق أولاً: .ضرب حفظ (رد على ملصق)`
        }, { quoted: msg });
        await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
        return;
      }

      const stickerBuffer = Buffer.from(savedSticker.sticker, 'base64');

      const senderName = await getDisplayName(sock, sender, chatId);
      const targetName = await getDisplayName(sock, who, chatId);

      await sock.sendMessage(
        chatId,
        {
          sticker: stickerBuffer,
          contextInfo: {
            mentionedJid: [who],
            forwardingScore: 200,
            isForwarded: true
          }
        },
        { quoted: msg }
      );

      await sock.sendMessage(
        chatId,
        {
          text: `@${senderName} يضرب @${targetName} 👊`,
          mentions: [sender, who]
        },
        { quoted: msg }
      );

      await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error('✗ خطأ في أمر ضرب:', error);
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `❌ حدث خطأ: ${error.message || 'خطأ غير معروف'}`
        },
        { quoted: msg }
      );
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: '❌', key: msg.key }
      });
    }
  }
};