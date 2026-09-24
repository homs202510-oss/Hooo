// لصوره.js - تحويل الملصق إلى صورة (نسخة محسنة بدون خطوط)
const fs = require('fs');
const path = require('path');
const { writeFile, mkdir } = require('fs/promises');
const { unlinkSync } = require('fs');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🖼️ تـحـويـل الـمـلـصـق 🖼️\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: ['لصوره', 'لصورة'],
    description: '🔁 تحويل الملصق إلى صورة (متاح للجميع)',
    usage: '.لصوره (بالرد على ملصق أو إرساله مباشرة)',
    category: 'وسائط',

    async execute(sock, m) {
        try {
            const chatId = m.key.remoteJid;

            // 🎯 الحصول على الملصق (مباشر أو مقتبس)
            const sticker = m.message?.stickerMessage ||
                m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;

            if (!sticker) {
                await sendMessage(sock, chatId, [
                    '❌ ابعت ملصق أو رد على ملصق الأول.',
                    '',
                    '📝 مثال: رد على ملصق واكتب .لصوره'
                ], m);
                return;
            }

            // ⬇️ تحميل بيانات الملصق
            const stream = await downloadContentFromMessage(sticker, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            if (!buffer.length) {
                await sendMessage(sock, chatId, [
                    '❌ فشل تحميل الملصق.'
                ], m);
                return;
            }

            // 📁 مجلد مؤقت
            const tempDir = (() => { const d = path.join(require('os').tmpdir(), 'phantom-tmp'); require('fs').mkdirSync(d, { recursive: true }); return d; })();
            if (!fs.existsSync(tempDir)) {
                await mkdir(tempDir, { recursive: true });
            }

            // 💾 حفظ مؤقت
            const filePath = path.join(tempDir, `sticker_${Date.now()}.webp`);
            await writeFile(filePath, buffer);

            // 🖼️ إرسال الصورة
            await sock.sendMessage(chatId, {
                image: buffer,
                caption: '✅ تم تحويل الملصق إلى صورة'
            }, { quoted: m });

            // 🧹 تنظيف
            try {
                if (fs.existsSync(filePath)) unlinkSync(filePath);
            } catch (e) {}

        } catch (err) {
            console.error('🚨 خطأ تحويل الملصق:', err);
            await sendMessage(sock, m.key.remoteJid, [
                '❌ حصل خطأ أثناء التحويل.',
                `📌 ${err.message || 'خطأ غير معروف'}`
            ], m);
        }
    }
};