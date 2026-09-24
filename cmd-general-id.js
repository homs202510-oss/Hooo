// ايدي.js - عرض المعرف (ID) للمستخدم أو المجموعة

const { jidDecode } = require('@whiskeysockets/baileys');

// ========== دالة استخراج المعرف النظيف ==========
function getPureId(jid) {
    try {
        const decoded = jidDecode(jid);
        if (decoded?.user) return decoded.user;
    } catch {}
    return jid.split('@')[0];
}

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🆔 الـمـعـرفـات 🆔\n`;
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
    command: ['ايدي', 'id'],
    description: '🆔 يعرض المعرف (ID) للمستخدم أو المجموعة.',
    usage: '.ايدي (مع منشن أو رد أو بدون)',
    category: 'عام',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const isGroup = chatId.endsWith('@g.us');

            // ===== تحديد الهدف =====
            let targetJid = null;
            const context = msg.message?.extendedTextMessage?.contextInfo;
            if (context?.mentionedJid?.length) {
                targetJid = context.mentionedJid[0];
            } else if (context?.participant) {
                targetJid = context.participant;
            }

            let lines = [];

            if (isGroup) {
                // معلومات المجموعة
                const groupId = chatId;
                const groupShortId = getPureId(groupId);

                // تحديد معرف العضو
                let targetUser = targetJid || sender;
                const userShortId = getPureId(targetUser);

                lines = [
                    `🏷️ *معرف المجموعة (كامل):*`,
                    `${groupId}`,
                    '',
                    `✨ *المختصر:* ${groupShortId}`,
                    '',
                    `👤 *معرف العضو (كامل):*`,
                    `${targetUser}`,
                    '',
                    `✨ *المختصر:* ${userShortId}`
                ];
            } else {
                // محادثة خاصة
                const userId = sender;
                const shortId = getPureId(userId);

                lines = [
                    `📱 *معرفك الكامل:*`,
                    `${userId}`,
                    '',
                    `✨ *المختصر:* ${shortId}`
                ];
            }

            await sendMessage(sock, chatId, lines, msg);
        } catch (error) {
            console.error('❌ خطأ في أمر ايدي:', error);
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