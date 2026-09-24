// دائري.js - تحويل فيديو إلى فيديو دائري (Video Note) - نسخة محسنة مع دعم الصوت
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = {
    command: ['دائري'],
    category: 'وسائط',
    description: '🔄 تحويل أي فيديو إلى فيديو دائري (Video Note) مع الحفاظ على الصوت',
    usage: '.دائري (رد على فيديو)',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const ctx = msg.message?.extendedTextMessage?.contextInfo;
            const quoted = ctx?.quotedMessage;

            if (!quoted || !quoted.videoMessage) {
                await sock.sendMessage(chatId, {
                    text: '❌ لازم ترد على *فيديو* علشان يتحول دائري.\n📝 مثال: رد على فيديو واكتب .دائري'
                }, { quoted: msg });
                return;
            }

            // تفاعل جارٍ التحويل
            await sock.sendMessage(chatId, {
                react: { text: '⏳', key: msg.key }
            });

            // ===== تحميل الفيديو =====
            const buffer = await downloadMediaMessage(
                {
                    key: {
                        remoteJid: chatId,
                        fromMe: false,
                        id: ctx.stanzaId,
                        participant: ctx.participant
                    },
                    message: quoted
                },
                'buffer'
            );

            if (!buffer || buffer.length === 0) {
                throw new Error('فشل تحميل الفيديو');
            }

            // ===== مجلد مؤقت =====
            const tempDir = (() => { const d = path.join(require('os').tmpdir(), 'phantom-tmp'); require('fs').mkdirSync(d, { recursive: true }); return d; })();
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const inputPath = path.join(tempDir, `input_${Date.now()}.mp4`);
            const outputPath = path.join(tempDir, `output_${Date.now()}.mp4`);

            fs.writeFileSync(inputPath, buffer);

            // ===== تحويل الفيديو إلى دائري (Video Note) مع الحفاظ على الصوت =====
            await new Promise((resolve, reject) => {
                // تحويل الفيديو مع الحفاظ على الصوت
                const cmd = `ffmpeg -y -i "${inputPath}" -vf "scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:black,crop=320:320" -c:a copy -movflags +faststart "${outputPath}"`;

                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        console.error('FFmpeg error:', stderr);
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });

            // ===== التحقق من وجود الملف الناتج =====
            if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1000) {
                throw new Error('فشل إنشاء الفيديو الدائري');
            }

            const outputBuffer = fs.readFileSync(outputPath);

            // ===== إرسال الفيديو الدائري =====
            await sock.sendMessage(chatId, {
                video: outputBuffer,
                mimetype: 'video/mp4',
                ptv: true
            }, { quoted: msg });

            // ===== تفاعل نجاح =====
            await sock.sendMessage(chatId, {
                react: { text: '✅', key: msg.key }
            });

            // ===== تنظيف الملفات المؤقتة =====
            try {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            } catch (e) {}

        } catch (err) {
            console.error('❌ خطأ تحويل فيديو دائري:', err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حصل خطأ أثناء التحويل.\n📌 ${err.message || 'خطأ غير معروف'}`
            }, { quoted: msg });

            await sock.sendMessage(msg.key.remoteJid, {
                react: { text: '❌', key: msg.key }
            });
        }
    }
};