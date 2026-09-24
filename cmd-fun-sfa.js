// صفع.js - أمر صفع متكامل (حفظ عام + إرسال مع أسماء حقيقية)
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const globalStickerPath = path.join(__dirname, 'db-global_slap_sticker.json');

// التأكد من وجود مجلد data
if (!fs.existsSync(path.dirname(globalStickerPath))) {
  fs.mkdirSync(path.dirname(globalStickerPath), { recursive: true });
}

// ========== دوال التخزين ==========
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

// ========== دالة تحميل الملصق ==========
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

// ========== دالة استخراج المنشن ==========
function extractJid(msg, chatId) {
  const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
  let who = null;

  // 1. منشن مباشر
  if (contextInfo.mentionedJid && contextInfo.mentionedJid.length > 0) {
    const validJids = contextInfo.mentionedJid.filter(jid => jid !== chatId);
    if (validJids.length > 0) {
      who = validJids[0];
    }
  }

  // 2. الرد على رسالة
  if (!who && contextInfo.quotedMessage) {
    who = contextInfo.participant || contextInfo.quotedMessage?.key?.participant;
  }

  // 3. منشن في النص
  if (!who) {
    const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const mentionMatch = fullText.match(/@(\d+)/);
    if (mentionMatch) {
      who = `${mentionMatch[1]}@s.whatsapp.net`;
    }
  }

  return who;
}

// ========== دالة جلب اسم المستخدم بشكل موثوق ==========
async function getDisplayName(sock, jid, chatId) {
  if (!jid) return 'شخص';

  try {
    // تنظيف المعرف للحصول على الرقم
    let cleanJid = jid;
    if (cleanJid.startsWith('lid:')) cleanJid = cleanJid.replace('lid:', '');
    if (cleanJid.includes('@')) cleanJid = cleanJid.split('@')[0];

    // 1. محاولة جلب الاسم من معلومات المجموعة (الأفضل)
    if (chatId && chatId.endsWith('@g.us')) {
      try {
        const groupMeta = await sock.groupMetadata(chatId);
        const participant = groupMeta.participants.find(p => p.id === jid);
        if (participant) {
          if (participant.name) return participant.name;
          if (participant.notify) return participant.notify;
          if (participant.shortName) return participant.shortName;
        }
      } catch (e) {
        // تجاهل الخطأ
      }
    }

    // 2. محاولة جلب الاسم من جهات الاتصال
    if (sock.contacts && sock.contacts[jid]) {
      const contact = sock.contacts[jid];
      if (contact.name) return contact.name;
      if (contact.notify) return contact.notify;
      if (contact.shortName) return contact.shortName;
    }

    // 3. استخدام sock.getName إن وجد
    if (typeof sock.getName === 'function') {
      try {
        const name = await sock.getName(jid);
        if (name) return name;
      } catch (e) {}
    }

    // 4. في النهاية نعيد الرقم النظيف
    return cleanJid || 'شخص';
  } catch (error) {
    console.error('خطأ في جلب الاسم:', error);
    let cleanJid = jid;
    if (cleanJid.startsWith('lid:')) cleanJid = cleanJid.replace('lid:', '');
    if (cleanJid.includes('@')) cleanJid = cleanJid.split('@')[0];
    return cleanJid || 'شخص';
  }
}

// ========== الأمر الرئيسي ==========
module.exports = {
  name: 'صفع',
  command: ['صفع'],
  description: '👋 صفع شخص (حفظ عام + إرسال مع أسماء حقيقية)',
  category: 'تسلية',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    try {
      const sender = msg.key.participant || msg.key.remoteJid;

      // ===== استخراج النص والأمر =====
      const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      const args = fullText.trim().split(/\s+/);
      const subCommand = args[1]?.toLowerCase() || '';

      // ===== وضع حفظ (دائماً عام) =====
      if (subCommand === 'حفظ' || subCommand === 'save') {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted || !quoted.stickerMessage) {
          await sock.sendMessage(chatId, {
            text: `📌 حفظ ملصق الصفع\n━━━━━━━━━━━━━━━━━━━━\n❌ يجب الرد على ملصق (ستيكر)\n📝 .صفع حفظ (رد على ملصق)\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
          }, { quoted: msg });
          return;
        }

        let stickerBuffer;
        try {
          stickerBuffer = await getStickerBuffer(quoted);
        } catch (error) {
          await sock.sendMessage(chatId, {
            text: `❌ فشل تحميل الملصق: ${error.message}`
          }, { quoted: msg });
          return;
        }

        if (!stickerBuffer || stickerBuffer.length < 100) {
          await sock.sendMessage(chatId, {
            text: '❌ الملصق فارغ أو تالف، حاول مرة أخرى.'
          }, { quoted: msg });
          return;
        }

        // حفظ عام (مفتاح واحد)
        const stickerData = loadSticker();
        stickerData['global'] = {
          sticker: stickerBuffer.toString('base64'),
          savedBy: sender,
          savedAt: Date.now()
        };
        saveSticker(stickerData);

        const displayName = await getDisplayName(sock, sender, chatId);
        await sock.sendMessage(chatId, {
          text: `✅ تم حفظ ملصق الصفع عاماً!\n━━━━━━━━━━━━━━━━━━━━\n📌 استخدم .صفع @منشن للإرسال\n👤 بواسطة: ${displayName}\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`,
          contextInfo: { mentionedJid: [sender] }
        }, { quoted: msg });
        return;
      }

      // ===== وضع الإرسال =====
      let who = extractJid(msg, chatId);

      if (!who) {
        await sock.sendMessage(chatId, {
          text: `👋 أمر صفع\n━━━━━━━━━━━━━━━━━━━━\n❌ يجب منشن الشخص المطلوب\n📝 .صفع @منشن\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
        }, { quoted: msg });
        return;
      }

      // منع صفع النفس أو المجموعة
      if (who === sender) {
        await sock.sendMessage(chatId, {
          text: `❌ لا يمكنك صفع نفسك!`
        }, { quoted: msg });
        return;
      }

      if (who === chatId) {
        await sock.sendMessage(chatId, {
          text: `❌ لا يمكنك صفع المجموعة!`
        }, { quoted: msg });
        return;
      }

      // تحميل الملصق المحفوظ (عام)
      const stickerData = loadSticker();
      const savedSticker = stickerData['global'];

      if (!savedSticker) {
        await sock.sendMessage(chatId, {
          text: `❌ لا يوجد ملصق صفع محفوظ.\n📌 قم بحفظ ملصق أولاً: .صفع حفظ (رد على ملصق)`
        }, { quoted: msg });
        return;
      }

      const stickerBuffer = Buffer.from(savedSticker.sticker, 'base64');

      // الحصول على الأسماء الحقيقية
      const senderName = await getDisplayName(sock, sender, chatId);
      const targetName = await getDisplayName(sock, who, chatId);

      // إرسال الملصق مع منشن
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

      // إرسال تعليق نصي مع منشن (سيظهر @أحمد صفع @هيثم)
      await sock.sendMessage(
        chatId,
        {
          text: `@${senderName} صفع @${targetName} 👋`,
          mentions: [sender, who]  // منشن صريح
        },
        { quoted: msg }
      );

    } catch (error) {
      console.error('✗ خطأ في أمر صفع:', error);
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `❌ حدث خطأ أثناء تنفيذ الأمر.\n📝 ${error.message || 'خطأ غير معروف'}`
        },
        { quoted: msg }
      );
    }
  }
};