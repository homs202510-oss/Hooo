// بالسر.js - يكشف مين بيحبك في الجروب (فضيحة)

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `💘 فـضـيـحـة الـحـب 💘\n`;
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
    command: 'بالسر',
    description: '💘 يكشف مين بيحبك في الجروب (فضيحة)',
    category: 'تسلية',
    usage: '.بالسر',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            // ===== التحقق من أن الأمر في مجموعة =====
            if (!chatId.endsWith('@g.us')) {
                await sendMessage(sock, chatId, [
                    '🚫 *هذا الأمر يعمل في الجروبات فقط*',
                    '',
                    '📌 يرجى استخدام الأمر في مجموعة'
                ], msg);
                return;
            }

            // ===== جلب بيانات المجموعة =====
            const metadata = await sock.groupMetadata(chatId);
            const members = metadata.participants.filter(p => p.id !== sender);

            if (members.length === 0) {
                await sendMessage(sock, chatId, [
                    '😢 *مافيش حد غيرك في الجروب!*',
                    '',
                    '📌 جرب في جروب فيه ناس تانية'
                ], msg);
                return;
            }

            // ===== اختيار عضو عشوائي =====
            const random = members[Math.floor(Math.random() * members.length)];
            const name = random?.id?.split('@')[0] || 'مش لاقي حد 😢';

            await sendMessage(sock, chatId, [
                `💘 *اللي بيحبك سرًا هو:*`,
                '',
                `🫦 @${name}`,
                '',
                `😍😍😍`
            ], msg, [random.id]);

        } catch (error) {
            console.error('❌ خطأ في أمر بالسر:', error);
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