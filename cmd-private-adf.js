// اضف.js - إضافة عضو للجروب عن طريق الرقم (للمطورين والأونر فقط)

const { isFounder, isOwnerbot } = require('./lib-roles');

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `➕ إضـافـة عـضـو ➕\n`;
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

module.exports = {
    name: 'اضافة',
    command: ['اضف'],
    category: "خاصة",
    description: "➕ إضافة عضو للجروب عن طريق الرقم (للمطورين والأونر فقط)",
    usage: '.اضف [الرقم]',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            // ===== التحقق من أنها مجموعة =====
            if (!chatId.endsWith('@g.us')) {
                await sendMessage(sock, chatId, [
                    '🚫 *هذا الأمر يعمل في الجروبات فقط*',
                    '',
                    '📌 يرجى استخدام الأمر في مجموعة'
                ], msg);
                return;
            }

            // ===== التحقق من الصلاحيات =====
            if (!isFounder(sender) && !isOwnerbot(sender)) {
                await sendMessage(sock, chatId, [
                    '🚫 *غير مصرح*',
                    '',
                    '🔒 هذا الأمر مخصص للمطورين والأونر فقط.'
                ], msg);
                return;
            }

            // ===== استخراج النص والرقم =====
            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/).slice(1);
            let text = args.join(' ');

            if (!text) {
                await sendMessage(sock, chatId, [
                    '📝 *الاستخدام:*',
                    '',
                    '📌 `.اضف [الرقم]`',
                    '',
                    '📝 *أمثلة:*',
                    '   `.اضف <الرقم>`',
                    '   `.اضف +<الرقم>`',
                    '',
                    '⚠️ يجب أن يكون الرقم صحيحاً (11-15 رقم)'
                ], msg);
                return;
            }

            // ===== استخراج الأرقام =====
            const numbers = text.match(/\d+/g);
            if (!numbers || numbers.length === 0) {
                await sendMessage(sock, chatId, [
                    '❌ *لم يتم العثور على رقم*',
                    '',
                    '📌 تأكد من كتابة الرقم بشكل صحيح',
                    '📝 مثال: `.اضف <الرقم>`'
                ], msg);
                return;
            }

            const user = numbers[0];
            if (user.length < 11 || user.length > 15) {
                await sendMessage(sock, chatId, [
                    '⚠️ *الرقم غير صحيح*',
                    '',
                    `📌 الرقم المدخل: ${user}`,
                    '📌 يجب أن يكون بين 11 و 15 رقماً'
                ], msg);
                return;
            }

            const jid = user + '@s.whatsapp.net';

            // ===== محاولة الإضافة =====
            try {
                await sock.groupParticipantsUpdate(chatId, [jid], 'add');

                await sendMessage(sock, chatId, [
                    '✅ *تمت الإضافة بنجاح* 🎉',
                    '',
                    `👤 تم إضافة @${user}`,
                    `👮‍♂️ بواسطة: @${sender.split('@')[0]}`
                ], msg, [jid, sender]);

            } catch (error) {
                console.error('❌ خطأ في إضافة العضو:', error);

                let errorLines = [
                    '❌ *فشل إضافة العضو*'
                ];

                if (error.message?.includes('not-authorized')) {
                    errorLines = [
                        '❌ *البوت ليس مشرفاً*',
                        '',
                        '🔑 يرجى ترقية البوت إلى مشرف في الجروب',
                        '📌 ثم حاول مرة أخرى'
                    ];
                } else if (error.message?.includes('already')) {
                    errorLines = [
                        'ℹ️ *العضو موجود بالفعل*',
                        '',
                        `👤 @${user} موجود بالفعل في المجموعة`
                    ];
                } else if (error.message?.includes('invalid')) {
                    errorLines = [
                        '❌ *الرقم غير صحيح*',
                        '',
                        `📌 ${user} ليس رقم واتساب صحيح`,
                        '📌 تأكد من أن الرقم مسجل على واتساب'
                    ];
                } else {
                    errorLines.push('');
                    errorLines.push(`📝 ${error.message || 'خطأ غير معروف'}`);
                }

                await sendMessage(sock, chatId, errorLines, msg, [jid]);
            }

        } catch (error) {
            console.error('❌ خطأ في أمر اضف:', error);
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