// صباحية.js - أذكار الصباح

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🌅 أذكـار الـصـبـاح 🌅\n`;
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
    command: ['صباحية', 'صباح'],
    category: 'ديني',
    description: '🌅 أذكار الصباح',
    usage: '.صباحية',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            const lines = [
                `🌅 *أذكار الصباح* 🌅`,
                '',
                `1. *اللهم بك أصبحنا وبك أمسينا وبك نحيا وبك نموت وإليك النشور.*`,
                '',
                `2. *أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.*`,
                '',
                `3. *اللهم إني أسألك خير هذا اليوم: فتحه، ونصره، ونوره، وبركته، وهداه، وأعوذ بك من شر ما فيه وشر ما بعده.*`,
                '',
                `4. *اللهم عافني في بدني، اللهم عافني في سمعي، اللهم عافني في بصري، لا إله إلا أنت.*`,
                '',
                `5. *أعوذ بكلمات الله التامات من شر ما خلق.* (3 مرات)`,
                '',
                `6. *حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم.* (7 مرات)`,
                '',
                `7. *آية الكرسي:* (البقرة:255)`,
                `   اللّهُ لا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ... وَهُوَ الْعَلِيُّ الْعَظِيمُ.`,
                '',
                `8. *سورة الإخلاص، الفلق، الناس* (3 مرات لكل سورة)`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('❌ خطأ في أمر صباحية:', error);
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