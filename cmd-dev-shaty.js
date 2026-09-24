// شاتي.js - رابط دعوة جروب الدعم (للكل) - نسخة محسنة بدون خطوط
const { isElite, extractPureNumber } = require('./lib-roles');

module.exports = {
    command: ['شاتي', 'الشات'],
    category: 'المطور',
    description: '🔗 رابط دعوة جروب الدعم',

    async execute(sock, msg, args = []) {
        try {
            const chatId = msg.key.remoteJid;

            // رابط جروب الدعم
            const inviteLink = 'https://chat.whatsapp.com/FL43hcmEAU7JIXVTRsayqT';

            const lines = [
                '🔗 *رابط جروب الدعم خاص بمطور البوت*',
                '',
                `📌 ${inviteLink}`,
                '',
                '👥 *جروب 𝑷𝑯𝑨𝑵𝑻𝑶𝑴*',
                '💡 *للاستفسارات والدعم*',
                '🛠️ *للتبليغ عن مشاكل*',
                '',
                '📌 الجميع مرحب به 🤗'
            ];

            let msgText = `🔗 رابـط الـجـروب 🔗\n`;
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            for (const line of lines) {
                msgText += `${line}\n`;
            }
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            msgText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

            await sock.sendMessage(chatId, {
                text: msgText
            }, { quoted: msg });

        } catch (error) {
            console.error('✗ خطأ في أمر شاتي:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ حدث خطأ أثناء تنفيذ الأمر.'
            }, { quoted: msg });
        }
    }
};