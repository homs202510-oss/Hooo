// ادمن.js - رفع أو خفض مشرف في المجموعة (يدعم رفع النفس)

const { isFounder, isOwnerbot, isDeveloper } = require('./lib-roles');

// ========== دالة الإرسال الفاخرة ==========
async function sendFancy(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `👑 إدارة المشرفين 👑\n`;
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
    command: ['ادمن', 'رفع', 'خفض'],
    category: 'ادارة',
    description: '👑 رفع أو خفض مشرف في المجموعة (للمشرفين والمطورين والمالك)',
    usage: '.ادمن رفع @منشن   أو   .رفع (رد على رسالة العضو)',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            // ===== التحقق من أنها مجموعة =====
            if (!chatId.endsWith('@g.us')) {
                await sendFancy(sock, chatId, [
                    '🚫 *هذا الأمر يعمل في الجروبات فقط*',
                    '',
                    '📌 يرجى استخدام الأمر في مجموعة'
                ], msg);
                return;
            }

            // ===== التحقق من الصلاحيات =====
            let hasPermission = false;

            // 1. المطورين والمالك
            if (isFounder(sender) || isOwnerbot(sender) || isDeveloper(sender)) {
                hasPermission = true;
            }

            // 2. مشرفي المجموعة
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
                await sendFancy(sock, chatId, [
                    '🚫 *غير مصرح*',
                    '',
                    '🔒 هذا الأمر للمشرفين والمطورين والمالك فقط.'
                ], msg);
                return;
            }

            // ===== استخراج النص والأمر =====
            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/);
            const commandUsed = args[0]?.replace('.', '') || '';

            // تحديد نوع العملية: رفع أو خفض
            let action = null;
            if (commandUsed === 'رفع') action = 'رفع';
            else if (commandUsed === 'خفض') action = 'خفض';
            else if (commandUsed === 'ادمن') {
                const textAfter = args.slice(1).join(' ');
                if (textAfter.includes('رفع')) action = 'رفع';
                else if (textAfter.includes('خفض')) action = 'خفض';
            }

            if (!action) {
                await sendFancy(sock, chatId, [
                    '⚙️ *طريقة الاستخدام:*',
                    '',
                    '📌 `.رفع @منشن`  ──  ترقية عضو إلى مشرف',
                    '📌 `.خفض @منشن`  ──  إزالة الإشراف عن عضو',
                    '📌 `.ادمن رفع @منشن`',
                    '📌 `.ادمن خفض @منشن`',
                    '📌 (رد على رسالة العضو) `.رفع` أو `.خفض`',
                    '',
                    '👤 *ملاحظة:* يمكنك رفع أو خفض نفسك أيضاً (إذا كنت مشرفاً)'
                ], msg);
                return;
            }

            // ===== تحديد الهدف =====
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
            let target = null;

            if (mentioned && mentioned.length > 0) {
                target = mentioned[0];
            } else if (quotedParticipant) {
                target = quotedParticipant;
            } else {
                // محاولة استخراج رقم من النص
                const numberMatch = fullText.match(/@?(\d+)/);
                if (numberMatch) {
                    target = `${numberMatch[1]}@s.whatsapp.net`;
                }
            }

            // ===== إذا لم يتم تحديد هدف، نعتبر أن المستخدم يريد رفع/خفض نفسه =====
            if (!target) {
                target = sender;
            }

            // ===== منع رفع/خفض البوت =====
            const botJid = sock.user.id;
            if (target === botJid) {
                await sendFancy(sock, chatId, [
                    '🚫 *لا يمكن رفع أو خفض البوت*',
                    '',
                    '📌 البوت يدير نفسه بنفسه.'
                ], msg, [sender]);
                return;
            }

            // ===== جلب بيانات المجموعة =====
            const groupMetadata = await sock.groupMetadata(chatId);
            const member = groupMetadata.participants.find(p => p.id === target);

            if (!member) {
                await sendFancy(sock, chatId, [
                    '❌ *العضو غير موجود في المجموعة*'
                ], msg, [target]);
                return;
            }

            const isAdmin = member.admin === 'admin' || member.admin === 'superadmin';

            // ===== تنفيذ العملية =====
            try {
                if (action === 'رفع') {
                    if (isAdmin) {
                        await sendFancy(sock, chatId, [
                            '✅ *العضو بالفعل مشرف*',
                            '',
                            `👤 @${target.split('@')[0]}`,
                            '📌 لا حاجة للترقية'
                        ], msg, [target]);
                        return;
                    }

                    await sock.groupParticipantsUpdate(chatId, [target], 'promote');

                    await sendFancy(sock, chatId, [
                        '✅ *تمت الترقية بنجاح*',
                        '',
                        `👤 @${target.split('@')[0]}`,
                        '🛡️ أصبح مشرفاً في المجموعة',
                        '',
                        `👮‍♂️ تم بواسطة: @${sender.split('@')[0]}`
                    ], msg, [target, sender]);

                } else if (action === 'خفض') {
                    if (!isAdmin) {
                        await sendFancy(sock, chatId, [
                            '❌ *العضو ليس مشرفاً بالفعل*',
                            '',
                            `👤 @${target.split('@')[0]}`,
                            '📌 لا يمكن خفضه'
                        ], msg, [target]);
                        return;
                    }

                    await sock.groupParticipantsUpdate(chatId, [target], 'demote');

                    await sendFancy(sock, chatId, [
                        '✅ *تمت إزالة الإشراف*',
                        '',
                        `👤 @${target.split('@')[0]}`,
                        '🔽 تم إزالة صلاحية المشرف',
                        '',
                        `👮‍♂️ تم بواسطة: @${sender.split('@')[0]}`
                    ], msg, [target, sender]);
                }

            } catch (error) {
                console.error('❌ خطأ في تنفيذ العملية:', error);

                let errorMsg = '';
                if (error.message.includes('not-authorized')) {
                    errorMsg += '\n\n🔑 البوت ليس لديه صلاحية التعديل على المشرفين';
                    errorMsg += '\n📌 تأكد من أن البوت مشرف في المجموعة';
                } else if (error.message.includes('forbidden')) {
                    errorMsg += '\n🔒 هات اشراف الاول يا حمار 🐦🐦';
                } else {
                    errorMsg += `\n\n📝 ${error.message || 'خطأ غير معروف'}`;
                }

                await sendFancy(sock, chatId, [errorMsg], msg);
            }

        } catch (error) {
            console.error('❌ خطأ في أمر ادمن:', error);
            await sendFancy(sock, msg.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};