// قص.js - قص الصورة لمربع (نسخة بسيطة وسريعة)
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `✂️ قص الـصـور ✂️\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== دوال مساعدة ==========
async function toBuffer(stream) {
    const chunks = [];
    for await (const c of stream) chunks.push(c);
    return Buffer.concat(chunks);
}

function getTempPath(prefix) {
    const tempDir = (() => { const d = path.join(require('os').tmpdir(), 'phantom-tmp'); require('fs').mkdirSync(d, { recursive: true }); return d; })();
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const now = Date.now();
    return {
        input: path.join(tempDir, `${prefix}_${now}.jpg`),
        output: path.join(tempDir, `${prefix}_${now}_out.jpg`)
    };
}

function cleanFiles(...files) {
    for (const f of files) {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
    }
}

module.exports = {
    command: ['مربع'],
    description: '✂️ قص الصورة لمربع (تزيل الزوائد وتحولها لمربع مثالي)',
    usage: '.مربع (رد على صورة)',
    category: 'وسائط',

    async execute(sock, m) {
        try {
            const chatId = m.key.remoteJid;

            // ===== التحقق من وجود صورة =====
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const image = quoted?.imageMessage ||
                         quoted?.viewOnceMessageV2?.message?.imageMessage ||
                         quoted?.viewOnceMessage?.message?.imageMessage ||
                         m.message?.imageMessage;

            if (!image) {
                await sendMessage(sock, chatId, [
                    '❌ *يجب الرد على صورة*',
                    '',
                    '📝 *طريقة الاستخدام:*',
                    '`.مربع` (رد على صورة)',
                    '',
                    '💡 ستعمل على قص الصورة وتحويلها لمربع مثالي'
                ], m);
                return;
            }

            // ===== تنزيل الصورة =====
            const stream = await downloadContentFromMessage(image, 'image');
            const buffer = await toBuffer(stream);

            // ===== حفظ مؤقت =====
            const paths = getTempPath('crop');
            fs.writeFileSync(paths.input, buffer);

            // ===== فلتر القص (يأخذ الجزء المركزي من الصورة ويجعله مربع) =====
            const filter = 'scale=1024:1024:force_original_aspect_ratio=increase,crop=1024:1024';

            // ===== تنفيذ ffmpeg =====
            await new Promise((resolve, reject) => {
                execFile(
                    'ffmpeg',
                    ['-y', '-i', paths.input, '-vf', filter, paths.output],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            // ===== التحقق من وجود الملف الناتج =====
            if (!fs.existsSync(paths.output) || fs.statSync(paths.output).size < 1024) {
                throw new Error('فشل قص الصورة');
            }

            // ===== إرسال الصورة المعالجة =====
            await sock.sendMessage(chatId, {
                image: fs.readFileSync(paths.output),
                caption: `✅ *تم قص الصورة بنجاح*\n🖼️ تحويلها لمربع مثالي`
            }, { quoted: m });

            // ===== تنظيف الملفات =====
            cleanFiles(paths.input, paths.output);

        } catch (error) {
            console.error('❌ خطأ في أمر قص:', error);
            
            let errorMsg = error.message || 'خطأ غير معروف';
            if (errorMsg.includes('ffmpeg')) {
                errorMsg = 'ffmpeg غير مثبت على الخادم. يرجى تثبيته أولاً.';
            }
            
            await sendMessage(sock, m.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${errorMsg}`,
                '',
                '📌 تأكد من أن الصورة صالحة وأن ffmpeg مثبت.'
            ], m);
        }
    }
};