// انوثه.js - نسبة الأنوثة لك أو لشخص آخر

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `💃 نـسـبـة الأنـوثـة 💃\n`;
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
    command: 'انوثه',
    description: '💃 نسبة الأنوثة لك أو لشخص آخر',
    usage: '.انوثه @عضو أو بالرد على رسالة',
    category: 'تسلية',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const context = msg.message?.extendedTextMessage?.contextInfo;

            let targetJid;

            // 1️⃣ لو رد على رسالة
            if (context?.participant) {
                targetJid = context.participant;

                // 2️⃣ لو منشن
            } else if (context?.mentionedJid && context.mentionedJid.length > 0) {
                targetJid = context.mentionedJid[0];

                // 3️⃣ لو لا رد ولا منشن → صاحب الأمر
            } else {
                targetJid = msg.key.participant || msg.key.remoteJid;
            }

            const percentage = Math.floor(Math.random() * 101);
            const targetId = targetJid.split('@')[0];

            let status = '';
            if (percentage > 70) status = '💅 دلع عالي المستوى';
            else if (percentage > 40) status = '🌸 أنوثة لطيفة';
            else status = '😎 كاريزما طاغية';

            const lines = [
                `👤 @${targetId}`,
                '',
                `✨ *النسبة:* ${percentage}%`,
                '',
                `${status}`
            ];

            await sendMessage(sock, chatId, lines, msg, [targetJid]);

        } catch (error) {
            console.error('❌ خطأ في أمر انوثه:', error);
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