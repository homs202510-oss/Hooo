const { jidDecode } = require('@whiskeysockets/baileys');
const { isElite, extractPureNumber } = require('./lib-roles');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
    command: 'حذف',
    description: '🗑️ لحذف الرسائل (للمشرفين والنخبة)',
    usage: '.حذف (رد على رسالة)',
    category: 'ادارة',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {

            // التأكد من أن الأمر في مجموعة
            if (!chatId.endsWith('@g.us')) {
                return await sock.sendMessage(chatId, {
                    text: '❌ هذا الأمر يعمل في المجموعات فقط.'
                }, { quoted: msg });
            }

            const senderJid = msg.key.participant || msg.participant || msg.key.remoteJid;
            const senderNumber = extractPureNumber(senderJid);
            const senderFull = decode(senderJid);

            // ===== 1. التحقق من النخبة =====
            const isEliteMember = isElite(senderNumber);

            // ===== 2. التحقق من المشرفين =====
            let isAdmin = false;
            try {
                const metadata = await sock.groupMetadata(chatId);
                for (const p of metadata.participants) {
                    if (p.id === senderFull || p.id === senderJid) {
                        if (p.admin === 'admin' || p.admin === 'superadmin') {
                            isAdmin = true;
                        }
                        break;
                    }
                }
            } catch (e) {
                console.warn('⚠️ فشل جلب بيانات المجموعة:', e.message);
                if (isEliteMember) isAdmin = true;
            }

            // ===== 3. التحقق النهائي =====
            if (!isAdmin && !isEliteMember) {
                return await sock.sendMessage(chatId, {
                    text: '❌ هذا الأمر للمشرفين أو النخبة فقط.'
                }, { quoted: msg });
            }

            // ===== 4. التحقق من الرد على رسالة =====
            const quoted = msg.message?.extendedTextMessage?.contextInfo;
            if (!quoted || !quoted.stanzaId || !quoted.participant) {
                return await sock.sendMessage(chatId, {
                    text: '❌ رد على رسالة بـ ".حذف" عشان أحذفها.'
                }, { quoted: msg });
            }

            // ===== 5. حذف الرسالتين بشكل صحيح =====
            const botJid = decode(sock.user.id);
            const isQuotedFromMe = quoted.participant === botJid;

            // ✅ حذف الرسالة المقتبسة
            await sock.sendMessage(chatId, {
                delete: {
                    remoteJid: chatId,
                    fromMe: isQuotedFromMe,
                    id: quoted.stanzaId,
                    participant: quoted.participant
                }
            });

            // ✅ حذف رسالة الأمر (باستخدام نفس طريقة حذف المقتبسة)
            await sock.sendMessage(chatId, {
                delete: {
                    remoteJid: chatId,
                    fromMe: msg.key.fromMe || false,
                    id: msg.key.id,
                    participant: msg.key.participant || chatId
                }
            });

            // ✅ صامت تماماً - لا يتم إرسال أي رسالة

        } catch (err) {
            console.error('❌ فشل حذف الرسالة:', err);
            await sock.sendMessage(chatId, {
                text: `❌ فشل حذف الرسالة.\nالسبب: ${err.message || 'خطأ غير معروف'}`
            }, { quoted: msg }).catch(() => {});
        }
    }
};