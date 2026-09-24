// بوت.js - اختبار البوت وعرض معلومات العضو (نسخة فاخرة)

const config = require('./config');
const hay = require('./lib-roles');
const { isElite } = require('./lib-roles');

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `✦ 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻 ✦\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: 'بوت',
    description: '✦ اختبار البوت وعرض معلومات العضو',
    usage: '.بوت',
    category: 'نظام',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const senderJid = msg.key.participant || msg.key.remoteJid;
            const senderNumber = senderJid.split('@')[0];
            const senderLid = hay.toLid(senderJid);
            const isGroup = chatId.endsWith('@g.us');

            // ===== تحديد الرتبة =====
            let rankEmoji = '👤';
            let rankTitle = 'عضو';
            let rankDesc = '💫 النظام نشط وجاهز لخدمتك! 💫\nمرحبًا بك يا عضو الشبكة 💠';

            // 1. المالك (Founder)
            if (hay.isFounder(senderLid)) {
                rankEmoji = '👑';
                rankTitle = 'المالك';
                rankDesc = '🌌 البوت في خدمتك دائمًا، يا منشئ البلازما! 🌌\n✨ نخدم أعلى ملك ✨';
            }
            // 2. الأونر بوت (Owner)
            else if (hay.isOwnerbot(senderLid)) {
                rankEmoji = '💎';
                rankTitle = 'مالك البوت';
                rankDesc = '🎭 مرحبًا بك يا سيد البوت! 🎭\nأوامرك تحرف الشيفرة نفسها ⚙️💥';
            }
            // 3. المطور (Developer)
            else if (hay.isDeveloper(senderLid)) {
                rankEmoji = '💻';
                rankTitle = 'مطور';
                rankDesc = '⚡ تم تفعيل وضع المطور! ⚡\nنبني المستقبل سطرًا سطرًا 💾🧠';
            }
            // 4. النخبة (Elite)
            else if (isElite(senderNumber)) {
                rankEmoji = '🛡️';
                rankTitle = 'نخبة';
                rankDesc = '🎯 تم اكتشاف عضو نخبة! 🎯\nالتميز يجري في عروقك 🦅';
            }
            // 5. مشرف المجموعة (Admin) - فقط إذا كانت المجموعة
            else if (isGroup) {
                try {
                    const groupMetadata = await sock.groupMetadata(chatId);
                    const participant = groupMetadata.participants.find(p => p.id === senderJid);
                    if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
                        rankEmoji = '🛠️';
                        rankTitle = 'مشرف';
                        rankDesc = '🔰 أنت من يدير الأمور هنا!\nشكرًا لك على جهودك في إدارة المجموعة 🫡';
                    }
                } catch (e) {
                    // تجاهل خطأ جلب بيانات المجموعة
                }
            }

            // ===== معلومات إضافية =====
            const now = new Date();
            const time = now.toLocaleTimeString('ar-EG');
            const date = now.toLocaleDateString('ar-EG');
            const botName = config.botName || '𝑷𝑯𝑨𝑵𝑻𝑶𝑴';
            const version = config.version || '4.0';

            // ===== بناء الرسالة =====
            const lines = [
                rankDesc,
                '',
                `╭───────────────╮`,
                `│ ${rankEmoji} *وضع ${rankTitle}* ${rankEmoji} │`,
                `╰───────────────╯`,
                '',
                `📱 *المستخدم:* @${senderNumber}`,
                `🕒 *الوقت:* ${time}`,
                `📅 *التاريخ:* ${date}`,
                `📌 *الإصدار:* ${version}`,
                '',
                `⚡ *قوة لا نهائية • تحكم ملكي* ⚡`,
                '',
                `💡 استخدم .اوامر لعرض جميع الأوامر`
            ];

            await sendMessage(sock, chatId, lines, msg, [senderJid]);

        } catch (error) {
            console.error('❌ خطأ في أمر بوت:', error);
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