// مشرفين.js - منشن جماعي للمشرفين فقط (مع صلاحيات النخبة والمشرفين)
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { isElite, extractPureNumber } = require('./lib-roles');

module.exports = {
    command: ['مشرفين', 'ادمنز'],
    category: 'ادارة',
    description: '👑 منشن جماعي للمشرفين فقط (للمشرفين والنخبة)',

    async execute(sock, msg, args = []) {
        try {
            const groupJid = msg.key.remoteJid;
            const senderJid = msg.key.participant || msg.participant || groupJid;
            const senderNumber = extractPureNumber(senderJid);

            // التأكد من أن الأمر في مجموعة
            if (!groupJid.endsWith('@g.us')) {
                await sendMessage(sock, groupJid, [
                    '🚫 هذا الأمر يعمل فقط داخل المجموعات.'
                ], msg);
                return;
            }

            const metadata = await sock.groupMetadata(groupJid);

            // جلب المشرفين فقط
            const admins = metadata.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id);

            // التحقق من صلاحية المرسل (مشرف أو نخبة)
            const isAdmin = admins.includes(senderJid);
            const isEliteMember = isElite(senderNumber);

            if (!isAdmin && !isEliteMember) {
                await sendMessage(sock, groupJid, [
                    '🚫 هذا الأمر مخصص للمشرفين والنخبة فقط.'
                ], msg);
                return;
            }

            if (admins.length === 0) {
                await sendMessage(sock, groupJid, [
                    '⚠️ لا يوجد مشرفين في هذا الجروب.'
                ], msg);
                return;
            }

            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quotedMsgKey = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
            const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

            // ===== الحالة 1: الرد على رسالة =====
            if (quoted) {
                const messageType = Object.keys(quoted)[0];

                if (['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(messageType)) {
                    const stream = await downloadMediaMessage(
                        {
                            key: { remoteJid: groupJid, id: quotedMsgKey, fromMe: false, participant: quotedParticipant },
                            message: quoted
                        },
                        'buffer',
                        {},
                        { logger: console }
                    );

                    const sendObj = {
                        mimetype: quoted[messageType].mimetype,
                        contextInfo: { mentionedJid: admins },
                    };

                    if (messageType === 'imageMessage') sendObj.image = stream;
                    else if (messageType === 'videoMessage') sendObj.video = stream;
                    else if (messageType === 'audioMessage') sendObj.audio = stream;
                    else if (messageType === 'documentMessage') sendObj.document = stream;
                    else if (messageType === 'stickerMessage') sendObj.sticker = stream;

                    await sock.sendMessage(groupJid, sendObj, { quoted: msg });
                    return;

                } else if (quoted.conversation || quoted.extendedTextMessage?.text) {
                    const text = quoted.conversation || quoted.extendedTextMessage.text;
                    await sock.sendMessage(groupJid, {
                        text: text,
                        mentions: admins
                    }, { quoted: msg });
                    return;

                } else {
                    await sendMessage(sock, groupJid, [
                        '⚠️ لا يمكن إعادة إرسال هذا النوع من الرسائل.'
                    ], msg);
                    return;
                }

            // ===== الحالة 2: بدون رد =====
            } else {
                // استخراج النص بعد الأمر
                const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                let cleanText = body
                    .replace(/^[.!،]?(مشرفين|ادمنز|admins|admin)\s*/i, '')
                    .trim();

                if (!cleanText && args && args.length > 0) {
                    cleanText = args.join(' ').trim();
                }

                // النص الافتراضي
                if (!cleanText) {
                    cleanText = '📢 تنبيه للمشرفين 👑';
                }

                // عرض عدد المشرفين
                const lines = [
                    `${cleanText}`,
                    ``,
                    `👑 *المشرفين:* ${admins.length}`,
                    ``,
                    `📊 المجموع: ${admins.length}`
                ];

                await sock.sendMessage(groupJid, {
                    text: lines.join('\n'),
                    mentions: admins
                }, { quoted: msg });
                return;
            }

        } catch (err) {
            console.error('❌ خطأ في أمر مشرفين:', err);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                `📌 ${err.message || err.toString()}`
            ], msg);
        }
    }
};

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `👑 المـشـرفـون 👑\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}