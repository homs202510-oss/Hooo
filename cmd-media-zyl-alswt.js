// زيل.js - إزالة الصوت من الفيديو (تعتيم/كتم الصوت)
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');

module.exports = {
    command: ['زيل'],
    category: 'وسائط',
    description: '🔇 إزالة الصوت من الفيديو (تعتيم الفيديو)',
    usage: '.زيل (رد على فيديو)',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {

            // ===== التحقق من وجود رد على فيديو =====
            const ctx = msg.message?.extendedTextMessage?.contextInfo;
            const quoted = ctx?.quotedMessage;

            if (!quoted || !quoted.videoMessage) {
                const lines = [
                    '🔇 *أمر إزالة الصوت*',
                    '',
                    '📌 الاستخدام:',
                    '.زيل (رد على فيديو)',
                    '',
                    '📝 مثال:',
                    'رد على فيديو واكتب .زيل',
                    '',
                    '✨ النتيجة: فيديو بدون صوت (تعتيم)'
                ];
                
                let msgText = `🔇 إزالـة الصـوت 🔇\n`;
                msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
                for (const line of lines) {
                    msgText += `${line}\n`;
                }
                msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
                msgText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
                
                await sock.sendMessage(chatId, { text: msgText }, { quoted: msg });
                return;
            }

            // ===== تفاعل جاري المعالجة =====
            await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });

            // ===== تحميل الفيديو =====
            await sock.sendMessage(chatId, {
                text: `📥 *جاري تحميل الفيديو...*`
            }, { quoted: msg });

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

            // ===== إزالة الصوت باستخدام FFmpeg =====
            await sock.sendMessage(chatId, {
                text: `🔄 *جاري إزالة الصوت من الفيديو...*`
            }, { quoted: msg });

            const tempDir = (() => { const d = path.join(require('os').tmpdir(), 'phantom-tmp'); require('fs').mkdirSync(d, { recursive: true }); return d; })();
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const inputPath = path.join(tempDir, `input_${Date.now()}.mp4`);
            const outputPath = path.join(tempDir, `output_${Date.now()}.mp4`);

            fs.writeFileSync(inputPath, buffer);

            // أمر FFmpeg: نسخ الفيديو بدون الصوت
            const cmd = `ffmpeg -y -i "${inputPath}" -c:v copy -an "${outputPath}"`;

            await new Promise((resolve, reject) => {
                exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('FFmpeg error:', stderr);
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });

            if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1000) {
                throw new Error('فشل إزالة الصوت من الفيديو');
            }

            const outputBuffer = fs.readFileSync(outputPath);

            // ===== تنظيف الملفات المؤقتة =====
            try {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            } catch (e) {}

            // ===== إرسال الفيديو بدون صوت =====
            const sizeInMB = (outputBuffer.length / (1024 * 1024)).toFixed(2);
            const caption = 
`🔇 *فيديو بدون صوت*
━━━━━━━━━━━━━━━━━━━━
📦 *الحجم:* ${sizeInMB} ميجا
🎬 *الحالة:* تمت إزالة الصوت
━━━━━━━━━━━━━━━━━━━━
𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

            await sock.sendMessage(chatId, {
                video: outputBuffer,
                mimetype: 'video/mp4',
                caption: caption
            }, { quoted: msg });

            // ===== تفاعل نجاح =====
            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });

        } catch (err) {
            console.error('❌ خطأ في أمر زيل:', err);

            let errorMsg = '❌ *حدث خطأ أثناء معالجة الفيديو*';
            
            if (err.message.includes('فشل تحميل الفيديو')) {
                errorMsg = '❌ *فشل تحميل الفيديو*\n📌 تأكد من أن الفيديو متاح';
            } else if (err.message.includes('فشل إزالة الصوت')) {
                errorMsg = '❌ *فشل إزالة الصوت*\n📌 تأكد من تثبيت FFmpeg';
            } else if (err.message.includes('FFmpeg')) {
                errorMsg = '❌ *FFmpeg غير مثبت*\n📌 قم بتثبيته باستخدام:\n`sudo apt install ffmpeg -y`';
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: errorMsg
            }, { quoted: msg });

            await sock.sendMessage(msg.key.remoteJid, {
                react: { text: '❌', key: msg.key }
            });
        }
    }
};