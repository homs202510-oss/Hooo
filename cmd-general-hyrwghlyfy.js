// هيروغليفي.js - تحويل النص العربي إلى هيروغليفية مصرية قديمة (نسخة محسنة بدون خطوط)
const hieroMap = {
    // الحروف العربية المفردة
    'ا': '𓄿', 'أ': '𓄿', 'إ': '𓄿', 'آ': '𓄿',
    'ب': '𓃀', 'ت': '𓏏', 'ث': '𓎡𓉔',
    'ج': '𓎼𓇋', 'ح': '𓉔', 'خ': '𓐍',
    'د': '𓂧', 'ذ': '𓊃', 'ر': '𓂋',
    'ز': '𓊃', 'س': '𓋴', 'ش': '𓈙',
    'ص': '𓋴', 'ض': '𓂧', 'ط': '𓏏',
    'ظ': '𓊃', 'ع': '𓂝', 'غ': '𓎼',
    'ف': '𓆑', 'ق': '𓈎', 'ك': '𓎡',
    'ل': '𓃭', 'م': '𓅓', 'ن': '𓈖',
    'ه': '𓉔', 'و': '𓅱', 'ي': '𓇌',
    'ى': '𓇌', 'ة': '𓏏', 'ء': '𓂝',
    // إضافة تشكيلات
    'ّ': '', 'َ': '', 'ُ': '', 'ِ': '', 'ْ': '', 'ً': '', 'ٌ': '', 'ٍ': '',
    // أرقام
    '0': '𓄤', '1': '𓏺', '2': '𓏻', '3': '𓏼', '4': '𓏽',
    '5': '𓏾', '6': '𓏿', '7': '𓐀', '8': '𓐁', '9': '𓐂'
};

// ========== تحويل النص ==========
function toHieroglyphic(text) {
    let result = '';
    for (const char of text) {
        if (hieroMap[char]) {
            result += hieroMap[char] + ' ';
        } else {
            result += char + ' ';
        }
    }
    return result.trim();
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `📜 تـرجـمـة هـيـروغـلـيـفـيـة 📜\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: ["هيروغليفي", "هيرو"],
    description: "🔮 تحويل النص العربي إلى كتابة هيروغليفية مصرية قديمة",
    category: "عام",
    usage: ".هيروغليفي النص (أو رد على رسالة)",

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            const messageText = msg.message?.conversation ||
                msg.message?.extendedTextMessage?.text || "";

            // لو المستخدم عامل رد على رسالة
            const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            let quotedText = "";
            
            if (quotedMessage) {
                if (quotedMessage.conversation) quotedText = quotedMessage.conversation;
                else if (quotedMessage.extendedTextMessage?.text) quotedText = quotedMessage.extendedTextMessage.text;
                else if (quotedMessage.imageMessage?.caption) quotedText = quotedMessage.imageMessage.caption;
                else if (quotedMessage.videoMessage?.caption) quotedText = quotedMessage.videoMessage.caption;
                else if (quotedMessage.documentMessage?.caption) quotedText = quotedMessage.documentMessage.caption;
            }

            // النص بعد الأمر
            const argsText = messageText.split(" ").slice(1).join(" ").trim();
            const finalText = quotedText || argsText;

            if (!finalText) {
                await sendMessage(sock, chatId, [
                    `⚠️ @${sender.split('@')[0]}`,
                    `📌 يجب إرسال نص للتحويل، أو الرد على رسالة تحتوي على نص.`,
                    ``,
                    `📝 مثال: .هيروغليفي مرحبا`,
                    `📝 مثال: (رد على رسالة) .هيروغليفي`
                ], msg, [sender]);
                return;
            }

            // تحويل النص
            const result = toHieroglyphic(finalText);

            // معلومات إضافية
            const originalLength = finalText.length;
            const hieroLength = result.split(' ').filter(c => c !== '').length;

            // ========== عرض النتيجة ==========
            const lines = [
                `👤 @${sender.split('@')[0]}`,
                ``,
                `📝 *النص الأصلي:*`,
                `${finalText}`,
                ``,
                `🔮 *الترجمة الهيروغليفية:*`,
                `${result}`,
                ``,
                `📊 *إحصائيات:*`,
                `   📝 عدد الحروف: ${originalLength}`,
                `   🔮 عدد الرموز: ${hieroLength}`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (err) {
            console.error("✗ خطأ في أمر الهيروغليفي:", err);
            await sendMessage(sock, msg.key.remoteJid, [
                `❌ حدث خطأ أثناء التحويل.`,
                `📌 حاول مرة أخرى لاحقاً.`
            ], msg);
        }
    }
};