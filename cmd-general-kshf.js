// كشف.js - إعادة توجيه الوسائط (صورة/فيديو/صوت) عند الرد عليها
// الصلاحيات: جميع الأعضاء

const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `📥 كـشـف الـوسـائـط 📥\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted });
}

module.exports = {
    command: ['كشف'],
    category: 'عام',
    description: '📥 استخراج وإعادة إرسال الصورة/الفيديو/الصوت من الرسالة المردود عليها',
    usage: '.كشف (رد على صورة/فيديو/صوت)',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            if (!msg.message) {
                return sendMessage(sock, chatId, [
                    '❌ لا يمكن العثور على محتوى الرسالة'
                ], msg);
            }

            const messageType = Object.keys(msg.message)[0];
            if (messageType !== 'extendedTextMessage' || !msg.message[messageType]?.contextInfo?.quotedMessage) {
                return sendMessage(sock, chatId, [
                    '❌ *يرجى الرد على رسالة وسائط*',
                    '',
                    '📌 *طريقة الاستخدام:*',
                    '`.كشف` (رد على صورة، فيديو، أو صوت)',
                    '',
                    '📌 *مثال:*',
                    '• ارد على صورة واكتب `.كشف`'
                ], msg, [sender]);
            }

            const quotedMessage = msg.message[messageType].contextInfo.quotedMessage;
            let targetMessage = quotedMessage;
            if (quotedMessage.viewOnceMessage) {
                targetMessage = quotedMessage.viewOnceMessage.message;
            }

            const mediaType = Object.keys(targetMessage)[0];
            if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(mediaType)) {
                return sendMessage(sock, chatId, [
                    '❌ هذه الرسالة ليست صورة أو فيديو أو صوت',
                    '',
                    '📌 تأكد من الرد على وسائط مدعومة فقط.'
                ], msg, [sender]);
            }

            // ===== تحميل الوسائط =====
            const buffer = await downloadMediaMessage(
                {
                    message: {
                        [mediaType]: targetMessage[mediaType]
                    }
                },
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            // ===== إرسال الوسائط =====
            const typeNames = {
                imageMessage: '🖼️ صورة',
                videoMessage: '🎥 فيديو',
                audioMessage: '🎵 صوت'
            };

            const caption = targetMessage[mediaType]?.caption || '';

            if (mediaType === 'imageMessage') {
                await sock.sendMessage(chatId, {
                    image: buffer,
                    caption: caption || `🖼️ *تم كشف الصورة*`
                }, { quoted: msg });
            } else if (mediaType === 'videoMessage') {
                await sock.sendMessage(chatId, {
                    video: buffer,
                    caption: caption || `🎥 *تم كشف الفيديو*\n📥 بواسطة: @${sender.split('@')[0]}`
                }, { quoted: msg });
            } else if (mediaType === 'audioMessage') {
                await sock.sendMessage(chatId, {
                    audio: buffer,
                    mimetype: 'audio/mp4',
                    ptt: false
                }, { quoted: msg });
            }

            // ===== رد فعل ✅ =====
            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });

        } catch (error) {
            console.error('❌ خطأ في أمر كشف:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ *حدث خطأ أثناء معالجة الوسائط*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 تأكد من أن الوسائط مدعومة وحاول مرة أخرى.'
            ], msg);
        }
    }
};