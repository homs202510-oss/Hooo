// رفع.js - رفع الملفات للرابط (نسخة محسنة بدون خطوط)
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { fileTypeFromBuffer } = require('file-type');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `📤 رفـع الـمـلـفـات 📤\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: ['لرابط'],
    category: 'عام',
    description: '📤 رفع ملف للرابط (صور - فيديو - صوت - ملفات)',
    usage: '.لرابط (رد على ملف)',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {

            // جلب الملف المقتبس
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (!quoted) {
                await sendMessage(sock, chatId, [
                    '❌ اتبع الخطوات التالية:',
                    '1️⃣ رد على صورة/فيديو/صوت/ملف',
                    '2️⃣ اكتب .لرابط'
                ], msg);
                return;
            }

            // تحديد نوع الملف
            let mediaMessage = null;
            let mediaType = '';
            let fileType = '';
            let mime = '';

            if (quoted.imageMessage) {
                mediaMessage = quoted.imageMessage;
                mediaType = 'image';
                fileType = 'صورة';
                mime = mediaMessage.mimetype || 'image/jpeg';
            } else if (quoted.videoMessage) {
                mediaMessage = quoted.videoMessage;
                mediaType = 'video';
                fileType = 'فيديو';
                mime = mediaMessage.mimetype || 'video/mp4';
            } else if (quoted.audioMessage) {
                mediaMessage = quoted.audioMessage;
                mediaType = 'audio';
                fileType = 'صوت';
                mime = mediaMessage.mimetype || 'audio/mpeg';
            } else if (quoted.documentMessage) {
                mediaMessage = quoted.documentMessage;
                mediaType = 'document';
                fileType = 'ملف';
                mime = mediaMessage.mimetype || 'application/octet-stream';
            } else if (quoted.stickerMessage) {
                mediaMessage = quoted.stickerMessage;
                mediaType = 'sticker';
                fileType = 'ملصق';
                mime = 'image/webp';
            }

            if (!mediaMessage) {
                await sendMessage(sock, chatId, [
                    '❌ هذا النوع من الملفات غير مدعوم'
                ], msg);
                return;
            }

            // ===== تحميل الملف =====
            let buffer = Buffer.from([]);
            try {
                const stream = await downloadContentFromMessage(mediaMessage, mediaType);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
            } catch (downloadError) {
                console.error('خطأ في التحميل:', downloadError.message);
                if (mediaMessage.url) {
                    const response = await axios.get(mediaMessage.url, { responseType: 'arraybuffer' });
                    buffer = Buffer.from(response.data);
                } else {
                    throw new Error('لا يمكن تحميل الملف');
                }
            }

            if (!buffer || buffer.length === 0) {
                throw new Error('الملف فارغ');
            }

            // إرسال رد فعل "جار التحميل"
            await sock.sendMessage(chatId, {
                react: { text: '⏳', key: msg.key }
            });

            // ===== رفع إلى خدمات استضافة الملفات =====
            const uploadToTmpFiles = async (buffer) => {
                try {
                    const type = await fileTypeFromBuffer(buffer);
                    const ext = type?.ext || 'dat';
                    const form = new FormData();
                    form.append('file', buffer, {
                        filename: `${Date.now()}.${ext}`,
                        contentType: type?.mime || 'application/octet-stream'
                    });
                    const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
                        headers: form.getHeaders(),
                        timeout: 30000
                    });
                    if (res.data?.data?.url) {
                        return res.data.data.url.replace('s.org/', 's.org/dl/');
                    }
                    return null;
                } catch (err) {
                    console.error('خطأ TmpFiles:', err.message);
                    return null;
                }
            };

            const uploadToCatbox = async (buffer) => {
                try {
                    const type = await fileTypeFromBuffer(buffer);
                    const ext = type?.ext || 'dat';
                    const form = new FormData();
                    form.append('fileToUpload', buffer, `file.${ext}`);
                    form.append('reqtype', 'fileupload');
                    const res = await axios.post('https://catbox.moe/user/api.php', form, {
                        headers: form.getHeaders(),
                        timeout: 30000
                    });
                    const link = res.data;
                    if (link && link.startsWith('https://')) {
                        return link;
                    }
                    return null;
                } catch (err) {
                    console.error('خطأ Catbox:', err.message);
                    return null;
                }
            };

            const uploadToUguu = async (buffer) => {
                try {
                    const type = await fileTypeFromBuffer(buffer);
                    const ext = type?.ext || 'dat';
                    const form = new FormData();
                    form.append('files[]', buffer, `file.${ext}`);
                    const res = await axios.post('https://uguu.se/upload.php', form, {
                        headers: form.getHeaders(),
                        timeout: 30000
                    });
                    return res.data?.files?.[0]?.url || null;
                } catch (err) {
                    console.error('خطأ Uguu:', err.message);
                    return null;
                }
            };

            // تنفيذ الرفع بثلاث خدمات مختلفة
            const [tmp, catbox, uguu] = await Promise.all([
                uploadToTmpFiles(buffer),
                uploadToCatbox(buffer),
                uploadToUguu(buffer)
            ]);

            // حساب الحجم
            const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);

            // بناء الرسالة
            const lines = [
                `✅ *تم الرفع بنجاح*`,
                `📦 الحجم: ${sizeMB} MB`,
                `📂 النوع: ${fileType}`,
                ``
            ];

            let hasLink = false;

            if (tmp) {
                lines.push(`🔗 *الرابط الأول (tmpfiles):*`);
                lines.push(`${tmp}`);
                lines.push(``);
                hasLink = true;
            }
            if (catbox) {
                lines.push(`🔗 *الرابط الثاني (catbox):*`);
                lines.push(`${catbox}`);
                lines.push(``);
                hasLink = true;
            }
            if (uguu) {
                lines.push(`🔗 *الرابط الثالث (uguu):*`);
                lines.push(`${uguu}`);
                lines.push(``);
                hasLink = true;
            }

            if (!hasLink) {
                await sendMessage(sock, chatId, [
                    '❌ فشل رفع الملف في جميع الخدمات، حاول مرة أخرى.'
                ], msg);
                return;
            }

            await sock.sendMessage(chatId, {
                react: { text: '✅', key: msg.key }
            });

            await sendMessage(sock, chatId, lines, msg);

        } catch (error) {
            console.error('❌ خطأ في رفع:', error);
            const chatId = msg.key.remoteJid;
            await sendMessage(sock, chatId, [
                '❌ فشل رفع الملف',
                `🔄 حاول مرة أخرى`,
                ``,
                `السبب: ${error.message}`
            ], msg);
        }
    }
};