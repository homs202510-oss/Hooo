// bot.js - تشغيل أو إيقاف البوت مؤقتاً (للمطورين فقط)

const fs = require('fs');
const path = require('path');
const { isElite } = require('./lib-roles');

const botStatusFile = path.join(__dirname, 'db-bot.txt');

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `🤖 حـالـة الـبـوت 🤖\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted });
}

// ========== ضمان وجود الملف ==========
function ensureFile() {
    const dir = path.dirname(botStatusFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(botStatusFile)) {
        fs.writeFileSync(botStatusFile, '[on]', 'utf8');
    }
}

// ========== قراءة حالة البوت ==========
function getBotStatus() {
    ensureFile();
    try {
        const content = fs.readFileSync(botStatusFile, 'utf8').trim();
        return content || '[on]';
    } catch {
        return '[on]';
    }
}

// ========== كتابة حالة البوت ==========
function setBotStatus(status) {
    ensureFile();
    fs.writeFileSync(botStatusFile, `[${status}]`, 'utf8');
}

module.exports = {
    command: ['bot'],
    description: '🤖 تشغيل أو إيقاف البوت مؤقتاً (للمطورين فقط)',
    category: 'خاصة',
    usage: '.bot       ──  عرض الحالة الحالية\n.bot on    ──  تشغيل البوت\n.bot off   ──  إيقاف البوت',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            // ===== التحقق من صلاحيات المطور =====
            if (!isElite(sender)) {
                return sendMessage(sock, chatId, [
                    'ذل من لا صلاحيات له 😂🫵'
                ], msg);
            }

            // ===== استخراج الأمر =====
            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const parts = fullText.trim().split(/\s+/);
            const action = parts.length > 1 ? parts[1].toLowerCase() : '';

            // ===== عرض الحالة الحالية =====
            if (!action || !['on', 'off'].includes(action)) {
                const currentStatus = getBotStatus();
                const statusText = currentStatus === '[on]' ? '🟢 مفعل' : '🔴 موقوف';
                return sendMessage(sock, chatId, [
                    '📊 *حالة البوت الحالية*',
                    '',
                    `📌 ${statusText}`,
                    '',
                    '📌 *لتغيير الحالة:*',
                    '`.bot on`  ──  تشغيل البوت',
                    '`.bot off` ──  إيقاف البوت'
                ], msg);
            }

            // ===== تغيير الحالة =====
            setBotStatus(action);
            const statusText = action === 'on' ? '🟢 مفعل' : '🔴 موقوف';
            const message = action === 'on' ? '✅ تم تشغيل البوت' : '⛔ تم إيقاف البوت';

            await sendMessage(sock, chatId, [
                message,
                '',
                `📌 الحالة الجديدة: ${statusText}`,
                '',
                '📌 استخدم `.bot` لعرض الحالة الحالية.'
            ], msg);

        } catch (error) {
            console.error('❌ خطأ في أمر bot:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};