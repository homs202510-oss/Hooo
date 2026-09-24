// استعادة.js - استعادة النسخ الاحتياطية للمملكة فقط (للمطورين فقط) - نسخة محسّنة
const fs = require('fs');
const path = require('path');
const hay = require('./lib-roles');

const dataDir = __dirname;
const KINGDOM_FILE = 'kingdom.json';
const KINGDOM_PATH = path.join(dataDir, KINGDOM_FILE);
const BACKUP_PATH = KINGDOM_PATH + '.bak';

// ===== مسارات التخزين المنفصل (للتحقق من وجودها) =====
const kingdomDir = path.join(__dirname, 'db-kingdom');
const MAIN_PATH = path.join(kingdomDir, 'main.json');

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); }
    catch { return {}; }
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `🔄 اسـتـعـادة الـمـمـالـك 🔄\n`;
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

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['استعادة', 'استرجاع'],
    description: '🔄 استعادة النسخة الاحتياطية للمملكة فقط (للمطورين فقط)',
    category: 'نظام',
    usage: '.استعادة',
    example: '.استعادة',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            // التحقق من الصلاحيات
            const senderLid = hay.toLid(sender);
            if (!(hay.isFounder(senderLid) || hay.isOwnerbot(senderLid) || hay.isDeveloper(senderLid))) {
                return await sendMessage(sock, chatId, ['🚫 هذا الأمر مخصص للمطورين فقط.'], msg, [sender]);
            }

            // ===== التحقق من وجود النسخة الاحتياطية =====
            if (!fs.existsSync(BACKUP_PATH)) {
                await sendMessage(sock, chatId, [
                    '❌ لا توجد نسخة احتياطية للمملكة.',
                    '',
                    '📌 تأكد من وجود ملف `kingdom.json.bak` في مجلد `data`.'
                ], msg, [sender]);
                return;
            }

            // ===== قراءة النسخة الاحتياطية =====
            let backupData = {};
            let backupCount = 0;
            try {
                backupData = loadJSON(BACKUP_PATH);
                backupCount = Object.keys(backupData).length;
            } catch (e) {
                await sendMessage(sock, chatId, [
                    '❌ فشل قراءة النسخة الاحتياطية.',
                    `📝 ${e.message}`
                ], msg, [sender]);
                return;
            }

            if (backupCount === 0) {
                await sendMessage(sock, chatId, [
                    '⚠️ النسخة الاحتياطية فارغة (0 مملكة).',
                    '📌 لا يمكن استعادة ملف فارغ.'
                ], msg, [sender]);
                return;
            }

            // ===== قراءة الملف الحالي =====
            let currentCount = 0;
            let currentData = {};
            if (fs.existsSync(KINGDOM_PATH)) {
                try {
                    currentData = loadJSON(KINGDOM_PATH);
                    currentCount = Object.keys(currentData).length;
                } catch (e) {}
            }

            // ===== عرض معلومات عن النسخة الاحتياطية =====
            const backupDate = fs.statSync(BACKUP_PATH).mtime.toLocaleString();
            const backupSize = Math.round(fs.statSync(BACKUP_PATH).size / 1024);

            await sendMessage(sock, chatId, [
                '📊 *معلومات النسخة الاحتياطية*',
                '',
                `📅 تاريخ النسخة: ${backupDate}`,
                `📦 حجم الملف: ${backupSize} كيلوبايت`,
                `👑 عدد الممالك: ${backupCount}`,
                `📊 الممالك الحالية: ${currentCount}`,
                '',
                '⚠️ سيتم استبدال ملف الممالك الحالي بالنسخة الاحتياطية.',
                `📌 هل أنت متأكد؟ اكتب \`تأكيد\` خلال 30 ثانية.`
            ], msg, [sender]);

            // ===== انتظار التأكيد =====
            const confirmHandler = async ({ messages }) => {
                for (const m of messages) {
                    const from = m.key.participant || m.participant || m.key.remoteJid;
                    if (from !== sender) continue;
                    const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                    if (txt.trim().toLowerCase() === 'تأكيد') {
                        try {
                            // ===== عمل نسخة من الملف الحالي (إن وجد) =====
                            if (fs.existsSync(KINGDOM_PATH)) {
                                fs.renameSync(KINGDOM_PATH, KINGDOM_PATH + '.old');
                            }
                            
                            // ===== استعادة النسخة الاحتياطية =====
                            fs.copyFileSync(BACKUP_PATH, KINGDOM_PATH);

                            // ===== قراءة الملف المستعاد للتأكيد =====
                            const restoredData = loadJSON(KINGDOM_PATH);
                            const restoredCount = Object.keys(restoredData).length;

                            // ===== عرض الممالك المستعادة (أول 10) =====
                            const kingdomsList = Object.entries(restoredData).slice(0, 10);
                            let kingdomsText = '';
                            for (const [jid, data] of kingdomsList) {
                                const name = data.name || `@${jid.split('@')[0]}`;
                                kingdomsText += `   • ${name} (مستوى ${data.level || 1})\n`;
                            }
                            if (restoredCount > 10) {
                                kingdomsText += `   • ... و ${restoredCount - 10} مملكة أخرى`;
                            }

                            // ===== التحقق من وجود نظام التخزين المنفصل =====
                            if (fs.existsSync(MAIN_PATH)) {
                                kingdomsText += '\n\n⚠️ *ملاحظة:* النظام يستخدم التخزين المنفصل حالياً.\n';
                                kingdomsText += '📌 بعض البيانات قد تكون مخزنة في ملفات منفصلة.';
                            }

                            await sendMessage(sock, chatId, [
                                `✅ تم استعادة الممالك بنجاح!`,
                                '',
                                `👑 عدد الممالك المستعادة: ${restoredCount}`,
                                '',
                                '📋 *قائمة الممالك المستعادة:*',
                                kingdomsText || '   لا توجد ممالك',
                                '',
                                '📌 أعد تشغيل البوت لتطبيق التغييرات.'
                            ], m, [sender]);
                            sock.ev.off('messages.upsert', confirmHandler);
                            return;
                        } catch (e) {
                            await sendMessage(sock, chatId, [
                                `❌ فشل الاستعادة: ${e.message}`
                            ], m, [sender]);
                            sock.ev.off('messages.upsert', confirmHandler);
                            return;
                        }
                    } else {
                        await sendMessage(sock, chatId, ['❌ تم إلغاء عملية الاستعادة.'], m, [sender]);
                        sock.ev.off('messages.upsert', confirmHandler);
                        return;
                    }
                }
            };

            sock.ev.on('messages.upsert', confirmHandler);
            setTimeout(() => {
                sock.ev.off('messages.upsert', confirmHandler);
            }, 30000);

        } catch (error) {
            console.error('✗ خطأ في أمر استعادة:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};