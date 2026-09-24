// ادارة.js - تغيير اسم، صورة، وصف الجروب (للمشرفين والنخبة)

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const {
  isFounder,
  isOwnerbot,
  isDeveloper
} = require('./lib-roles');

const { isElite } = require('./lib-roles');

// ========== دوال مساعدة ==========
function toBuffer(stream) {
  return new Promise(async (resolve) => {
    const chunks = [];
    for await (const c of stream) chunks.push(c);
    resolve(Buffer.concat(chunks));
  });
}

// ========== دالة التحقق من الصلاحيات ==========
function hasAccess(sender, chatId, groupMetadata) {
  const senderNumber = sender.split('@')[0];
  
  // التحقق من المشرفين
  const me = groupMetadata.participants.find(p => p.id === sender);
  const isAdmin = !!me?.admin;
  
  // التحقق من النخبة والمطورين
  const isEliteMember = isElite(senderNumber);
  const isDev = isDeveloper(sender) || isOwnerbot(sender) || isFounder(sender);
  
  return isAdmin || isEliteMember || isDev;
}

// ========== دالة الإرسال مع الرد ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
  if (!Array.isArray(lines)) {
    lines = [lines];
  }

  let msg = `🔧 إدارة الجروب 🔧\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  for (const line of lines) {
    msg += `${line}\n`;
  }
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
  
  await sock.sendMessage(chatId, { 
    text: msg, 
    mentions 
  }, { 
    quoted: quoted 
  });
}

// ========== دالة تغيير الاسم ==========
async function changeGroupName(sock, chatId, newName, sender, oldName, quotedMsg) {
  const senderNumber = sender.split('@')[0];
  
  // التحقق من طول الاسم
  if (newName.length > 25) {
    await sendMessage(sock, chatId, [
      '⚠️ *الاسم طويل جداً*',
      '',
      `📌 الحد الأقصى 25 حرفاً (الآن ${newName.length})`
    ], quotedMsg);
    return false;
  }

  // تغيير الاسم
  await sock.groupUpdateSubject(chatId, newName);

  // رسالة النجاح
  const messageText = 
    `✅ *تم تغيير اسم الجروب* 🎉\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📌 *الاسم القديم:* ${oldName}\n` +
    `📌 *الاسم الجديد:* ${newName}\n` +
    `👤 *تم بواسطة:* @${senderNumber}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

  await sock.sendMessage(chatId, {
    text: messageText,
    mentions: [sender]
  }, { quoted: quotedMsg });

  console.log(`✅ تم تغيير اسم الجروب من "${oldName}" إلى "${newName}" بواسطة ${senderNumber}`);
  return true;
}

// ========== دالة تغيير الصورة ==========
async function changeGroupImage(sock, chatId, media, type, sender, quotedMsg) {
  const senderNumber = sender.split('@')[0];
  
  // تحميل الميديا
  const stream = await downloadContentFromMessage(media, type);
  const buffer = await toBuffer(stream);

  // إنشاء مجلد مؤقت
  const tempDir = (() => { const d = path.join(require('os').tmpdir(), 'phantom-tmp'); require('fs').mkdirSync(d, { recursive: true }); return d; })();
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const input = path.join(tempDir, `${Date.now()}.webp`);
  const output = path.join(tempDir, `${Date.now()}.jpg`);

  fs.writeFileSync(input, buffer);

  return new Promise((resolve, reject) => {
    execFile(
      'ffmpeg',
      [
        '-y',
        '-i', input,
        '-vf',
        'scale=640:640:force_original_aspect_ratio=decrease,pad=640:640:(ow-iw)/2:(oh-ih)/2:white',
        output
      ],
      async (err) => {
        try {
          if (err || !fs.existsSync(output)) {
            reject(new Error('فشل تحويل الصورة'));
            return;
          }

          const finalBuffer = fs.readFileSync(output);

          // تغيير الصورة
          await sock.updateProfilePicture(chatId, finalBuffer);

          // رسالة النجاح
          const messageText = 
            `✅ *تم تغيير صورة الجروب* 🖼️\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `👤 *تم بواسطة:* @${senderNumber}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

          await sock.sendMessage(chatId, {
            text: messageText,
            mentions: [sender]
          }, { quoted: quotedMsg });

          console.log(`✅ تم تغيير صورة الجروب بواسطة ${senderNumber}`);
          resolve(true);

        } catch (error) {
          reject(error);
        } finally {
          // تنظيف الملفات المؤقتة
          try {
            if (fs.existsSync(input)) fs.unlinkSync(input);
            if (fs.existsSync(output)) fs.unlinkSync(output);
          } catch {}
        }
      }
    );
  });
}

// ========== دالة تغيير الوصف ==========
async function changeGroupDescription(sock, chatId, newDescription, sender, oldDescription, quotedMsg) {
  const senderNumber = sender.split('@')[0];
  
  // التحقق من طول الوصف
  if (newDescription.length > 500) {
    await sendMessage(sock, chatId, [
      '⚠️ *الوصف طويل جداً*',
      '',
      `📌 الحد الأقصى 500 حرف (الآن ${newDescription.length})`
    ], quotedMsg);
    return false;
  }

  // تغيير الوصف
  await sock.groupUpdateDescription(chatId, newDescription);

  // رسالة النجاح
  const messageText = 
    `✅ *تم تغيير وصف الجروب* 📝\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📌 *الوصف القديم:*\n${oldDescription || 'لا يوجد وصف'}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📌 *الوصف الجديد:*\n${newDescription}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *تم بواسطة:* @${senderNumber}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

  await sock.sendMessage(chatId, {
    text: messageText,
    mentions: [sender]
  }, { quoted: quotedMsg });

  console.log(`✅ تم تغيير وصف الجروب بواسطة ${senderNumber}`);
  return true;
}

// ========== الأمر الرئيسي ==========
module.exports = {
  command: ['تغيير', 'تسمية', 'وصف'],
  description: '🔧 تغيير اسم، صورة، أو وصف الجروب (للمشرفين والنخبة)',
  category: 'ادارة',
  usage: '.تسمية الاسم الجديد\n.تغيير (رد على صورة أو ملصق)\n.وصف الوصف الجديد',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    try {

      // ===== التحقق من أن الأمر في جروب =====
      if (!chatId.endsWith('@g.us')) {
        await sendMessage(sock, chatId, [
          '🚫 *هذا الأمر يعمل داخل المجموعات فقط*',
          '',
          '📌 يرجى استخدام الأمر في جروب'
        ], msg);
        return;
      }

      const sender = msg.key.participant || msg.key.remoteJid;
      const senderNumber = sender.split('@')[0];

      // ===== جلب بيانات الجروب =====
      const groupMetadata = await sock.groupMetadata(chatId);

      // ===== التحقق من الصلاحيات =====
      if (!hasAccess(sender, chatId, groupMetadata)) {
        await sendMessage(sock, chatId, [
          '❌ *غير مصرح*',
          '',
          '🔒 هذا الأمر للمشرفين والنخبة فقط.',
          '📌 النخبة: المطورون والمالكون'
        ], msg);
        return;
      }

      // ===== قراءة النص الكامل =====
      const fullText =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';

      // ===== تحديد نوع الأمر =====
      const command = fullText.trim().split(/\s+/)[0]?.replace('.', '') || '';

      // ===== 1. تغيير الاسم (.تسمية) =====
      if (command === 'تسمية' || command === 'اسم') {
        const parts = fullText.trim().split(/\s+/);
        parts.shift();
        const newName = parts.join(' ').trim();

        if (!newName) {
          await sendMessage(sock, chatId, [
            '⚠️ *يرجى كتابة الاسم الجديد*',
            '',
            '📌 الصيغة: `.تسمية الاسم الجديد`',
            '',
            'مثال: `.تسمية مملكة السعادة`'
          ], msg);
          return;
        }

        const oldName = groupMetadata.subject;
        await changeGroupName(sock, chatId, newName, sender, oldName, msg);
        return;
      }

      // ===== 2. تغيير الصورة (.تغيير) =====
      if (command === 'تغيير') {
        const quoted =
          msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted) {
          await sendMessage(sock, chatId, [
            '⚠️ *يرجى الرد على صورة أو ملصق*',
            '',
            '📌 الصيغة: رد على صورة أو ملصق ثم `.تغيير`',
            '',
            '📌 يمكنك استخدام: `.تغيير` (رد على صورة)'
          ], msg);
          return;
        }

        // البحث عن الصورة
        const image =
          quoted?.imageMessage ||
          quoted?.viewOnceMessageV2?.message?.imageMessage ||
          quoted?.viewOnceMessage?.message?.imageMessage;

        const sticker = quoted?.stickerMessage;

        if (!image && !sticker) {
          await sendMessage(sock, chatId, [
            '❌ *نوع الملف غير مدعوم*',
            '',
            '📌 يرجى الرد على صورة أو ملصق فقط'
          ], msg);
          return;
        }

        const media = image || sticker;
        const type = image ? 'image' : 'sticker';

        try {
          await changeGroupImage(sock, chatId, media, type, sender, msg);
        } catch (error) {
          await sendMessage(sock, chatId, [
            '❌ *فشل تغيير الصورة*',
            '',
            `📝 ${error.message || 'خطأ غير معروف'}`
          ], msg);
        }
        return;
      }

      // ===== 3. تغيير الوصف (.وصف) =====
      if (command === 'وصف') {
        // محاولة قراءة الوصف من الرد
        const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let newDescription = '';

        if (quotedMessage?.conversation) {
          newDescription = quotedMessage.conversation.trim();
        } else if (quotedMessage?.extendedTextMessage?.text) {
          newDescription = quotedMessage.extendedTextMessage.text.trim();
        }

        // إذا لم يتم الرد، نأخذ من النص
        if (!newDescription && fullText) {
          const parts = fullText.trim().split(/\s+/);
          if (parts.length > 1) {
            newDescription = parts.slice(1).join(' ');
          }
        }

        if (!newDescription) {
          await sendMessage(sock, chatId, [
            '⚠️ *يرجى كتابة الوصف الجديد*',
            '',
            '📌 الصيغة: `.وصف الوصف الجديد`',
            '',
            '📌 أو رد على رسالة تحتوي على الوصف الجديد',
            '',
            'مثال: `.وصف هذا هو وصف الجروب الجديد`'
          ], msg);
          return;
        }

        const oldDescription = groupMetadata.desc || 'لا يوجد وصف';
        await changeGroupDescription(sock, chatId, newDescription, sender, oldDescription, msg);
        return;
      }

      // ===== 4. أمر غير معروف - عرض المساعدة =====
      await sendMessage(sock, chatId, [
        '📚 *أوامر إدارة الجروب*',
        '',
        '📌 `.تسمية الاسم الجديد`',
        '   → تغيير اسم الجروب',
        '',
        '📌 `.تغيير` (رد على صورة/ملصق)',
        '   → تغيير صورة الجروب',
        '',
        '📌 `.وصف الوصف الجديد`',
        '   → تغيير وصف الجروب',
        '   (أو رد على رسالة تحتوي على الوصف)',
        '',
        '🔒 *الصلاحيات:*',
        '   • المشرفين',
        '   • النخبة (المطورون والمالكون)'
      ], msg);

    } catch (error) {
      console.error('❌ خطأ في أمر ادارة:', error);

      let errorMsg = [
        '❌ *حدث خطأ*',
        '',
        `📝 ${error.message || 'خطأ غير معروف'}`
      ];

      // أخطاء شائعة
      if (error.message?.includes('not-authorized')) {
        errorMsg = [
          '❌ *البوت ليس مشرفاً!*',
          '',
          '🔑 يرجى ترقية البوت إلى مشرف في الجروب',
          '📌 ثم حاول مرة أخرى'
        ];
      } else if (error.message?.includes('rate-overlimit')) {
        errorMsg = [
          '⏳ *تم التغيير مؤخراً!*',
          '',
          '📌 يرجى الانتظار قليلاً قبل المحاولة مرة أخرى'
        ];
      }

      await sendMessage(sock, chatId, errorMsg, msg);
    }
  }
};