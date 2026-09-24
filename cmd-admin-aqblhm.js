// اقبلهم.js - قبول جميع طلبات الانضمام (للمشرفين والمطورين فقط، بدون نخبة)

const { isFounder, isOwnerbot, isDeveloper, toLid } = require('./lib-roles');
// لم نعد نستورد isElite

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🛡️ قـبـول الـطـلـبـات 🛡️\n`;
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
    command: ['اقبلهم', 'قبول'],
    category: 'ادارة',
    description: '🛡️ قبول جميع طلبات الانضمام المعلقة',
    usage: '.اقبلهم',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const senderLid = toLid(sender);

            // ===== التحقق من أنها مجموعة =====
            if (!chatId.endsWith('@g.us')) {
                await sendMessage(sock, chatId, [
                    '🚫 *هذا الأمر يعمل في الجروبات فقط*',
                    '',
                    '📌 يرجى استخدام الأمر في مجموعة'
                ], msg);
                return;
            }

            // ===== التحقق من الصلاحيات (بدون نخبة) =====
            let hasPermission = false;

            // 1. المطورين، الأونر، المؤسس
            if (isFounder(senderLid) || isOwnerbot(senderLid) || isDeveloper(senderLid)) {
                hasPermission = true;
            }

            // 2. مشرفي المجموعة (إذا لم يكن من النخبة أو المطورين)
            if (!hasPermission) {
                try {
                    const groupMetadata = await sock.groupMetadata(chatId);
                    const participant = groupMetadata.participants.find(p => p.id === sender);
                    if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
                        hasPermission = true;
                    }
                } catch (e) {
                    console.error('❌ خطأ في جلب بيانات المجموعة:', e);
                }
            }

            if (!hasPermission) {
                await sendMessage(sock, chatId, [
                    '🚫 *غير مصرح*',
                    '',
                    '🔒 هذا الأمر للمشرفين والمطورين فقط.'
                ], msg);
                return;
            }

            // ===== تنفيذ الأمر =====
            try {
                const pendingRequests = await sock.groupRequestParticipantsList(chatId);
                if (!pendingRequests || pendingRequests.length === 0) {
                    await sendMessage(sock, chatId, [
                        '📭 *لا يوجد طلبات انضمام*',
                        '',
                        '✅ قائمة الانتظار فارغة حالياً'
                    ], msg);
                    return;
                }

                const jids = pendingRequests.map(req => req.jid);
                await sock.groupRequestParticipantsUpdate(chatId, jids, 'approve');

                await sendMessage(sock, chatId, [
                    '✅ *تم قبول الطلبات بنجاح*',
                    '',
                    `📌 عدد الأعضاء المقبولين: *${jids.length}*`,
                    '',
                    '🎉 مرحباً بكم في المجموعة!'
                ], msg);

            } catch (error) {
                console.error('✗ خطأ في أمر اقبلهم:', error);

                let errorLines = [
                    '❌ *حدث خطأ أثناء قبول الطلبات*',
                    '',
                    `📝 ${error.message || 'خطأ غير معروف'}`
                ];

                if (error.message.includes('not authorized')) {
                    errorLines = [
                        '❌ *البوت ليس مشرفاً*',
                        '',
                        '🔑 يرجى ترقية البوت إلى مشرف في الجروب',
                        '📌 ثم حاول مرة أخرى'
                    ];
                }

                await sendMessage(sock, chatId, errorLines, msg);
            }

        } catch (error) {
            console.error('✗ خطأ في أمر اقبلهم:', error);
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