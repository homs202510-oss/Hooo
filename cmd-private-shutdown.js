// إيقاف.js - إيقاف البوت فورياً (للمطورين فقط)

const { jidDecode } = require('@whiskeysockets/baileys');
const hay = require('./lib-roles');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🛑 إيـقـاف الـبـوت 🛑\n`;
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
    command: ['إيقاف', 'stop'],
    description: '🛑 إيقاف البوت فورياً (خاص بالمطورين فقط)',
    category: 'خاصة',
    usage: '.إيقاف',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = decode(msg.key.participant || msg.key.remoteJid);
            const senderLid = hay.toLid(sender);

            // ===== التحقق من الصلاحيات =====
            if (!(hay.isFounder(senderLid) || hay.isOwnerbot(senderLid) || hay.isDeveloper(senderLid))) {
                await sendMessage(sock, chatId, [
                    '🚫 *غير مصرح*',
                    '',
                    '🔒 هذا الأمر مخصص للمطورين فقط.',
                    '📌 لا يمكن لأي شخص آخر استخدامه'
                ], msg);
                return;
            }

            // ===== طلب تأكيد =====
            await sendMessage(sock, chatId, [
                '⛔ *جاري إيقاف البوت...*',
                '',
                '⚡ سيتم إيقاف البوت خلال 3 ثوانٍ.',
                '💡 لإلغاء الأمر، لا تفعل شيئاً.'
            ], msg);

            setTimeout(async () => {
                console.log('🛑 تم إيقاف البوت بواسطة المطور');
                process.exit(0);
            }, 3000);

        } catch (error) {
            console.error('❌ خطأ في أمر إيقاف:', error);
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