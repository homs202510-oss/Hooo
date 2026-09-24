// نص-فني.js - إنشاء تصميم فني للنص مع خلفية متدرجة (نسخة محسنة)

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎨 تـصـمـيـم فـنـي 🎨\n`;
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

// ========== دالة كشف اللغة ==========
function isArabic(text) {
    return /[\u0600-\u06FF]/.test(text);
}

// ========== دالة العثور على خط ==========
function findFont(isArabicText) {
    const fonts = isArabicText
        ? [
            '/system/fonts/NotoSansArabic-Regular.ttf',
            '/system/fonts/NotoNaskhArabic-Regular.ttf',
            '/system/fonts/NotoKufiArabic-Regular.ttf',
            '/system/fonts/DroidSansArabic.ttf'
        ]
        : [
            '/system/fonts/Roboto-Regular.ttf',
            '/system/fonts/arial.ttf',
            '/system/fonts/Arial.ttf'
        ];

    for (const f of fonts) {
        if (fs.existsSync(f)) return f;
    }
    // fallback
    return isArabicText ? '/system/fonts/NotoSansArabic-Regular.ttf' : '/system/fonts/Roboto-Regular.ttf';
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ["نص", "فني", "تصميم"],
    category: "عام",
    description: "🎨 تصميم فني للنص مع خلفية متدرجة",
    usage: ".نص [النص]",

    async execute(sock, m) {
        try {
            const from = m.key.remoteJid;

            const body = m.message?.conversation ||
                m.message?.extendedTextMessage?.text ||
                m.message?.imageMessage?.caption ||
                '';

            const args = body.trim().split(/\s+/);
            args.shift();
            const text = args.join(' ');

            if (!text) {
                const lines = [
                    '📌 `.نص [النص]`',
                    '📝 مثال: `.نص ماكيما`',
                    '✨ يدعم العربية والإنجليزية'
                ];
                await sendMessage(sock, from, lines, m);
                return;
            }

            // ===== تفاعل سريع =====
            try { await sock.sendMessage(from, { react: { text: "🎨", key: m.key } }); } catch {}

            // ===== مجلد مؤقت =====
            const tempDir = (() => { const d = path.join(require('os').tmpdir(), 'phantom-tmp'); require('fs').mkdirSync(d, { recursive: true }); return d; })();
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const output = path.join(tempDir, `art_${Date.now()}.png`);
            const isArabicText = isArabic(text);
            const fontPath = findFont(isArabicText);
            const safeText = text.replace(/['"\\]/g, '').replace(/:/g, '\\:').replace(/;/g, '\\;');

            // ===== تصميم الخلفية المتدرجة =====
            // ألوان: أزرق غامق -> بنفسجي -> وردي
            const colors = [
                { pos: 0, color: '#0d0d2b' },
                { pos: 0.5, color: '#1a0a3e' },
                { pos: 1, color: '#2d0a4a' }
            ];

            // ===== إنشاء الصورة =====
            // استخدام خلفية متدرجة مع تأثيرات إضافية
            const cmd = `ffmpeg -y -f lavfi -i "gradients=s=800x600:c0=#0d0d2b:c1=#1a0a3e:c2=#2d0a4a" -vf "
drawtext=fontfile='${fontPath}':text='${safeText}':fontcolor=#ffffff:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2-10:shadowcolor=#e94560:shadowx=6:shadowy=6:borderw=4:bordercolor=#e94560
" -frames:v 1 "${output}"`;

            await new Promise((resolve, reject) => {
                exec(cmd, (err) => {
                    if (err) {
                        // محاولة ثانية بتأثيرات أخف
                        const cmd2 = `ffmpeg -y -f lavfi -i "color=c=#0a0a1a:s=800x600" -vf "
drawtext=fontfile='${fontPath}':text='${safeText}':fontcolor=#ffffff:fontsize=70:x=(w-text_w)/2:y=(h-text_h)/2:shadowcolor=#e94560:shadowx=4:shadowy=4:borderw=3:bordercolor=#e94560
" -frames:v 1 "${output}"`;
                        exec(cmd2, (err2) => {
                            if (err2) reject(err2);
                            else resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            });

            // ===== التحقق =====
            if (!fs.existsSync(output) || fs.statSync(output).size < 1000) {
                await sendMessage(sock, from, ['❌ فشل إنشاء التصميم، حاول مرة أخرى'], m);
                return;
            }

            // ===== إرسال الصورة مع كابتشن قصير =====
            await sock.sendMessage(from, {
                image: fs.readFileSync(output),
                caption: `🎨✅ *تم إنشاء التصميم بنجاح* 🎉
            
            📝 *النص:* *${text}*\n━━━━━━━━━━━━━━━━━━━━\n𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`
            }, { quoted: m });

            // ===== تنظيف =====
            try { fs.unlinkSync(output); } catch {}

        } catch (error) {
            console.error("❌ خطأ:", error);
            await sock.sendMessage(m.key.remoteJid, {
                text: `❌ خطأ: ${error.message || 'حاول مرة أخرى'}`
            }, { quoted: m });
        }
    }
};