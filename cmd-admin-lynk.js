// لينك.js - رابط دعوة المجموعة (للنخبة والمشرفين) - نسخة محسنة بدون خطوط
const { isElite, extractPureNumber } = require('./lib-roles');

// ========== دالة تحويل النص إلى خط مزخرف ==========
function toFancyText(text) {
    const map = {
        'A': '𝑨', 'B': '𝑩', 'C': '𝑪', 'D': '𝑫', 'E': '𝑬', 'F': '𝑭', 'G': '𝑮',
        'H': '𝑯', 'I': '𝑰', 'J': '𝑱', 'K': '𝑲', 'L': '𝑳', 'M': '𝑴', 'N': '𝑵',
        'O': '𝑶', 'P': '𝑷', 'Q': '𝑸', 'R': '𝑹', 'S': '𝑺', 'T': '𝑻', 'U': '𝑼',
        'V': '𝑽', 'W': '𝑾', 'X': '𝑿', 'Y': '𝒀', 'Z': '𝒁',
        'a': '𝒂', 'b': '𝒃', 'c': '𝒄', 'd': '𝒅', 'e': '𝒆', 'f': '𝒇', 'g': '𝒈',
        'h': '𝒉', 'i': '𝒊', 'j': '𝒋', 'k': '𝒌', 'l': '𝒍', 'm': '𝒎', 'n': '𝒏',
        'o': '𝒐', 'p': '𝒑', 'q': '𝒒', 'r': '𝒓', 's': '𝒔', 't': '𝒕', 'u': '𝒖',
        'v': '𝒗', 'w': '𝒘', 'x': '𝒙', 'y': '𝒚', 'z': '𝒛'
    };
    return text.split('').map(ch => map[ch] || ch).join('');
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🔗 رابـط الـدعـوة 🔗\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== التحقق من صلاحية المشرف في المجموعة ==========
async function isGroupAdmin(sock, chatId, jid) {
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participant = metadata.participants.find(p => p.id === jid);
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch {
        return false;
    }
}

module.exports = {
    command: 'لينك',
    description: '🔗 عرض رابط دعوة المجموعة مع اسم المجموعة المزخرف (للنخبة والمشرفين)',
    category: 'ادارة',
    usage: '.لينك',
    example: '.لينك',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
            const senderNumber = extractPureNumber(sender);

            if (!chatId.endsWith('@g.us')) {
                await sendMessage(sock, chatId, [
                    '❌ هذا الأمر يعمل فقط في المجموعات.'
                ], msg);
                return;
            }

            const isEliteMember = isElite(senderNumber);
            const isAdmin = await isGroupAdmin(sock, chatId, sender);

            if (!isEliteMember && !isAdmin) {
                await sendMessage(sock, chatId, [
                    '🚫 هذا الأمر مخصص للنخبة والمشرفين فقط.'
                ], msg);
                return;
            }

            // جلب بيانات المجموعة
            const groupMetadata = await sock.groupMetadata(chatId);
            const groupName = groupMetadata.subject || 'بدون اسم';
            const fancyGroupName = toFancyText(groupName);

            // جلب رابط الدعوة
            const inviteCode = await sock.groupInviteCode(chatId);
            const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

            // بناء المحتوى
            const lines = [
                `📋 *${fancyGroupName}*`,
                ``,
                `🔗 ${inviteLink}`,
                ``,
                `👤 بواسطة: @${sender.split('@')[0]}`,
                `📌 انسخ الرابط وأرسله لمن تريد دعوته.`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر لينك:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء جلب الرابط.',
                `📌 ${error.message || 'خطأ غير معروف'}`
            ], msg);
        }
    }
};