// المطور — معلومات مطور PHANTOM
const config = require('./config');

module.exports = {
    command: ['المطور', 'مطوري', 'owner'],
    description: '👨‍💻 يعرض معلومات مطور البوت',
    category: 'المطور',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const developerName = 'حمص';
            const number = String(config.ownerNumber || '').replace(/\D/g, '');
            const developerPhone = number ? `+${number}` : 'غير محدد';

            if (number) {
                const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${developerName}
TEL;type=CELL;waid=${number}:${developerPhone}
NOTE:مطور PHANTOM BOT
END:VCARD`;

                await sock.sendMessage(
                    chatId,
                    { contacts: { displayName: `مطور ${developerName}`, contacts: [{ vcard }] } },
                    { quoted: msg }
                );
            }

            const text = `╭── 🎯 *مـعـلـومـات الـمـطـور* ──╮

╰─➤ 👤 *الاسـم:* ${developerName}
╰─➤ 📞 *الرقم:* ${developerPhone}
╰─➤ 🤖 *الـبـوت:* 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻

━━━━━━━━━━━━━━━

╰─🚫 *مـلاحـظـة هـامـة:*
⛔ الرجاء عدم الإرسال في الخاص إلا للضرورة فقط.

━━━━━━━━━━━━━━━

👻 شبح يعرف كل حاجة 👻

╰── ❖ 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❖ ──╯`;

            await sock.sendMessage(chatId, { text }, { quoted: msg });
        } catch (err) {
            console.error('❌ خطأ في أمر المطور:', err);
            await sock.sendMessage(
                msg.key.remoteJid,
                { text: '❌ حصل خطأ أثناء عرض معلومات المطور.' },
                { quoted: msg }
            );
        }
    }
};
