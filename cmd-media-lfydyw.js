// لفيديو.js - تحويل الملصق المتحرك إلى فيديو (نسخة محسنة بدون خطوط)
const fs = require('fs');
const path = require('path');
const { mkdir, writeFile } = require('fs/promises');
const { exec } = require('child_process');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const pointsController = require('./lib-points-legacy');

const conversionPrice = 150;

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🎞️ تـحـويـل الـمـلـصـق 🎞️\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
       category: 'وسائط',
      command: 'لفيديو',
    description: '🎞️ تحويل الملصق المتحرك إلى فيديو',
    usage: '.لفيديو (رد على ملصق متحرك)',
    price: conversionPrice,

    async execute(sock, m) {
        const chatId = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const senderId = sender.split('@')[0];
        const username = `@${senderId}`;

        const sticker = m.message?.stickerMessage ||
                       m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;

        if (!sticker) {
            await sendMessage(sock, chatId, [
                '🎞️ *أمر تحويل الملصق المتحرك*',
                '',
                '📝 الاستخدام: .لفيديو (رد على الملصق)',
                `💰 التكلفة: ${conversionPrice} نقطة`,
                '',
                '📌 مثال: رد على ملصق متحرك واكتب .لفيديو'
            ], m);
            return;
        }

        // ✅ التأكد من أن الملصق متحرك
        if (!sticker.isAnimated) {
            await sendMessage(sock, chatId, [
                '❌ هذا ملصق عادي، أرسل ملصق متحرك (متحرك).'
            ], m);
            return;
        }

        // ===== التحقق من الرصيد =====
        const userInfo = pointsController.getUserInfo(sender);
        const current = userInfo.balance || 0;

        if (current < conversionPrice) {
            await sendMessage(sock, chatId, [
                '❌ *رصيد غير كافٍ*',
                '',
                `👤 المستخدم: ${username}`,
                `📊 نقاطك الحالية: ${current} نقطة`,
                `💰 المطلوب: ${conversionPrice} نقطة`,
                `💔 تحتاج: ${conversionPrice - current} نقطة إضافية`
            ], m, [sender]);
            return;
        }

        await sock.sendMessage(chatId, {
            react: { text: "⏳", key: m.key }
        });

        const tempDir = (() => { const d = path.join(require('os').tmpdir(), 'phantom-tmp'); require('fs').mkdirSync(d, { recursive: true }); return d; })();
        if (!fs.existsSync(tempDir)) {
            await mkdir(tempDir, { recursive: true });
        }

        const tempWebp = path.join(tempDir, `sticker_${Date.now()}.webp`);
        const tempGif = tempWebp.replace('.webp', '.gif');
        const tempMp4 = tempWebp.replace('.webp', '.mp4');

        try {
            // ===== تحميل الملصق =====
            const stream = await downloadContentFromMessage(sticker, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            if (!buffer.length) {
                throw new Error('الملصق فارغ');
            }

            await writeFile(tempWebp, buffer);

            // ===== تحويل WebP → GIF باستخدام ImageMagick =====
            await new Promise((resolve, reject) => {
                const cmd = `convert "${tempWebp}" "${tempGif}"`;
                exec(cmd, (error) => {
                    if (error) {
                        const fallbackCmd = `magick "${tempWebp}" "${tempGif}"`;
                        exec(fallbackCmd, (err2) => {
                            if (err2) {
                                reject(new Error('فشل تحويل WebP إلى GIF. تأكد من تثبيت ImageMagick.'));
                            } else {
                                resolve();
                            }
                        });
                    } else {
                        resolve();
                    }
                });
            });

            // ===== تحويل GIF → MP4 باستخدام FFmpeg =====
            await new Promise((resolve, reject) => {
                const ffmpegCmd = `ffmpeg -y -i "${tempGif}" -movflags faststart -pix_fmt yuv420p -vf "scale=512:512" "${tempMp4}"`;
                exec(ffmpegCmd, (error) => {
                    if (error) {
                        reject(new Error('فشل تحويل GIF إلى فيديو. تأكد من تثبيت FFmpeg.'));
                    } else {
                        resolve();
                    }
                });
            });

            // ===== التحقق من وجود الفيديو =====
            if (!fs.existsSync(tempMp4)) {
                throw new Error('لم يتم إنشاء ملف الفيديو');
            }

            const videoBuffer = fs.readFileSync(tempMp4);
            if (videoBuffer.length === 0) {
                throw new Error('ملف الفيديو فارغ');
            }

            // ===== خصم النقاط =====
            const result = pointsController.processDeduction(sender, conversionPrice, 'تحويل ملصق إلى فيديو');
            const userInfoAfter = pointsController.getUserInfo(sender);
            const newBalance = userInfoAfter.balance || 0;

            // ===== إرسال الفيديو =====
            await sock.sendMessage(chatId, {
                react: { text: "✅", key: m.key }
            });

            const lines = [
                '🎬 *تم تحويل الملصق إلى فيديو*',
                '',
                `👤 المستخدم: ${username}`,
                `💰 الخصم: -${conversionPrice} نقطة`,
                `📊 رصيدك الجديد: ${newBalance} نقطة`
            ];

            await sock.sendMessage(chatId, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption: lines.join('\n')
            }, { quoted: m });

        } catch (err) {
            console.error('❌ خطأ:', err);
            
            await sendMessage(sock, chatId, [
                '❌ فشل التحويل',
                '',
                `السبب: ${err.message}`
            ], m);
        } finally {
            // ===== تنظيف الملفات المؤقتة =====
            try { if (fs.existsSync(tempWebp)) fs.unlinkSync(tempWebp); } catch {}
            try { if (fs.existsSync(tempGif)) fs.unlinkSync(tempGif); } catch {}
            try { if (fs.existsSync(tempMp4)) fs.unlinkSync(tempMp4); } catch {}
        }
    }
};