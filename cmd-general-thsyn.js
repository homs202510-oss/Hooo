// تحسين.js - تحسين جودة الصور (محلي + DeepAI)

const axios = require('axios');
const FormData = require('form-data');
const { fileTypeFromBuffer } = require('file-type');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

// ========== دوال مساعدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🖼️ تـحـسـيـن الـجـودة 🖼️\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    
    await sock.sendMessage(chatId, { 
        text: msg, 
        mentions 
    }, { 
        quoted: quoted 
    });
}

// ========== رفع الصورة على Catbox ==========
const uploadToCatbox = async (buffer) => {
    try {
        const type = await fileTypeFromBuffer(buffer);
        const ext = type ? type.ext : 'jpg';
        const form = new FormData();
        form.append('fileToUpload', buffer, `file.${ext}`);
        form.append('reqtype', 'fileupload');

        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: {
                ...form.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 30000,
        });

        const text = response.data;
        if (text.startsWith('https://')) return text;
        throw new Error('فشل رفع الملف: ' + text);
    } catch (error) {
        console.error('❌ خطأ في الرفع:', error.message);
        throw new Error(`فشل رفع الملف: ${error.message}`);
    }
};

// ========== تنزيل الميديا من الرسالة ==========
async function getBufferFromQuoted(quoted, type) {
    try {
        const stream = await downloadContentFromMessage(
            quoted[`${type}Message`],
            type
        );
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    } catch (error) {
        console.error('❌ خطأ في التحميل:', error.message);
        throw new Error('فشل تحميل الصورة من الرسالة.');
    }
}

// ========== تحسين محلي باستخدام ffmpeg ==========
async function enhanceLocally(buffer) {
    try {
        const tempDir = (() => { const d = path.join(require('os').tmpdir(), 'phantom-tmp'); require('fs').mkdirSync(d, { recursive: true }); return d; })();
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const inputPath = path.join(tempDir, `input-${Date.now()}.jpg`);
        const outputPath = path.join(tempDir, `output-${Date.now()}.jpg`);

        fs.writeFileSync(inputPath, buffer);

        const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vf "scale=iw*2:ih*2:flags=lanczos,unsharp=5:5:1.0:5:5:0.5,eq=brightness=0.05:contrast=1.1:saturation=1.1" -q:v 2 "${outputPath}"`;

        console.log('🔄 تشغيل ffmpeg للتحسين المحلي...');
        await execPromise(ffmpegCmd);

        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
            const enhancedBuffer = fs.readFileSync(outputPath);
            try { fs.unlinkSync(inputPath); } catch { }
            try { fs.unlinkSync(outputPath); } catch { }
            return enhancedBuffer;
        }
        throw new Error('فشل التحسين المحلي');
    } catch (error) {
        console.error('❌ فشل التحسين المحلي:', error.message);
        throw new Error(`فشل التحسين المحلي: ${error.message}`);
    }
}

// ========== تحسين باستخدام DeepAI ==========
async function enhanceWithDeepAI(imageUrl) {
    try {
        const form = new FormData();
        form.append('image', imageUrl);

        const response = await axios.post(
            'https://api.deepai.org/api/torch-srgan',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'api-key': 'quickstart-QUdJIGlzIGNvbWluZyBzb29u',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                timeout: 60000,
            }
        );

        if (response.data && response.data.output_url) {
            return response.data.output_url;
        }
        throw new Error('فشل تحسين الصورة عبر DeepAI');
    } catch (error) {
        console.error('❌ فشل DeepAI:', error.message);
        throw new Error(`فشل DeepAI: ${error.message}`);
    }
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['تحسين', 'جودة'],
    description: '🖼️ تحسين جودة الصورة (محلي + DeepAI)',
    category: 'عام',
    usage: '.تحسين (رد على صورة)',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;

        try {
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            if (!quoted || !quoted.imageMessage) {
                await sendMessage(sock, chatId, [
                    '❌ *يرجى الرد على صورة*',
                    '',
                    '📌 قم بالرد على الصورة التي تريد تحسينها',
                    '📝 مثال: `.تحسين` (رد على صورة)'
                ], msg);
                return;
            }

            // ===== تحميل الصورة =====
            let buffer;
            try {
                buffer = await getBufferFromQuoted(quoted, "image");
            } catch (error) {
                await sendMessage(sock, chatId, [
                    '❌ *فشل تحميل الصورة*',
                    '',
                    `📝 ${error.message}`,
                    '📌 تأكد من أن الصورة صالحة'
                ], msg);
                return;
            }

            if (!buffer || buffer.length === 0) {
                await sendMessage(sock, chatId, [
                    '❌ *الصورة فارغة*',
                    '',
                    '📌 تأكد من أن الصورة تحتوي على بيانات'
                ], msg);
                return;
            }

            // ===== رسالة جاري المعالجة =====
            await sock.sendMessage(chatId, {
                text: `⏳ *جاري تحسين الصورة...*\n━━━━━━━━━━━━━━━━━━━━\n🖼️ قد يستغرق هذا بعض الوقت`
            }, { quoted: msg });

            let resultBuffer = null;
            let resultUrl = null;
            const errors = [];

            // ===== المحاولة 1: تحسين محلي =====
            try {
                console.log('🔄 محاولة التحسين المحلي...');
                resultBuffer = await enhanceLocally(buffer);
                if (resultBuffer && resultBuffer.length > 0) {
                    console.log('✅ تم التحسين محلياً');
                }
            } catch (error) {
                errors.push(`محلي: ${error.message}`);
                console.warn('⚠️ فشل التحسين المحلي:', error.message);
            }

            // ===== المحاولة 2: DeepAI (إذا فشل المحلي) =====
            if (!resultBuffer) {
                try {
                    console.log('🔄 محاولة رفع الصورة لـ Catbox...');
                    const imgUrl = await uploadToCatbox(buffer);
                    console.log('🔄 محاولة تحسين باستخدام DeepAI...');
                    resultUrl = await enhanceWithDeepAI(imgUrl);
                    if (resultUrl) {
                        console.log('✅ تم التحسين باستخدام DeepAI');
                    }
                } catch (error) {
                    errors.push(`DeepAI: ${error.message}`);
                    console.warn('⚠️ فشل DeepAI:', error.message);
                }
            }

            // ===== إرسال النتيجة =====
            if (resultBuffer) {
                await sock.sendMessage(chatId, {
                    image: resultBuffer,
                    caption: `✨ *تم تحسين الصورة بنجاح!*\n━━━━━━━━━━━━━━━━━━━━\n🖼️ طريقة التحسين: محلية (ffmpeg)\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
                }, { quoted: msg });
            } else if (resultUrl) {
                await sock.sendMessage(chatId, {
                    image: { url: resultUrl },
                    caption: `✨ *تم تحسين الصورة بنجاح!*\n━━━━━━━━━━━━━━━━━━━━\n🖼️ طريقة التحسين: DeepAI\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
                }, { quoted: msg });
            } else {
                // في حالة فشل كل الطرق، نرسل الصورة الأصلية
                await sendMessage(sock, chatId, [
                    '⚠️ *تعذر تحسين الصورة*',
                    '',
                    '📌 جميع محاولات التحسين فشلت:',
                    ...errors.map(e => `   • ${e}`),
                    '',
                    '💡 تم إرسال الصورة الأصلية بدلاً من ذلك'
                ], msg);

                await sock.sendMessage(chatId, {
                    image: buffer,
                    caption: `🖼️ *الصورة الأصلية*\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('❌ خطأ في أمر تحسين:', error);
            await sendMessage(sock, chatId, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};