// تشغيل.js - تفعيل البوت في المحادثة (للمطورين فقط)

const fs = require('fs');
const path = require('path');
const { isElite } = require('./lib-roles');

const disabledChatsPath = path.join(__dirname, 'db-disabledChats.json');

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `⚙️ تـشـغـيـل الـبـوت ⚙️\n`;
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
    const dir = path.dirname(disabledChatsPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(disabledChatsPath)) {
        fs.writeFileSync(disabledChatsPath, JSON.stringify({}, null, 2));
    }
}

// ========== تحميل المحادثات الموقوفة ==========
function loadDisabledChats() {
    ensureFile();
    try {
        return JSON.parse(fs.readFileSync(disabledChatsPath, 'utf8'));
    } catch {
        return {};
    }
}

// ========== حفظ المحادثات الموقوفة ==========
function saveDisabledChats(data) {
    ensureFile();
    fs.writeFileSync(disabledChatsPath, JSON.stringify(data, null, 2));
}

module.exports = {
    command: ['تفعيل_الشات'],
    description: '⚙️ تفعيل البوت في المحادثة (للمطورين فقط)',
    category: 'خاصة',
    usage: '.تفعيل_الشات  ──  تفعيل البوت في المجموعة/الخاص',

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

            // ===== تحميل البيانات =====
            const disabledChats = loadDisabledChats();

            // ===== التحقق من الحالة =====
            if (!disabledChats[chatId]) {
                return sendMessage(sock, chatId, [
                    '✅ *البوت مفعل بالفعل*',
                    '',
                    '📌 البوت يعمل في هذه المحادثة.',
                    '📌 استخدم `.إيقاف` لتعطيله.'
                ], msg);
            }

            // ===== تفعيل البوت =====
            delete disabledChats[chatId];
            saveDisabledChats(disabledChats);

            await sendMessage(sock, chatId, [
                '✅ *تم التفعيل بنجاح*',
                '',
                '🟢 البوت يعمل الآن في هذه المحادثة.',
                '📌 استخدم `.إيقاف` لتعطيله مرة أخرى.'
            ], msg);

        } catch (error) {
            console.error('❌ خطأ في أمر تشغيل:', error);
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