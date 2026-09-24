// استطلاع.js - إنشاء استطلاع رأي (حقوق 𝑷𝑯𝑨𝑵𝑻𝑶𝑴)

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `📊 إنـشـاء اسـتـطـلاع 📊\n`;
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
    command: ['استطلاع'],
    description: "📊 إنشاء استطلاع رأي (Poll)",
    category: "عام",
    usage: ".استطلاع [السؤال] + [خيار1] + [خيار2] + ...",

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {

            const text =
                msg.message?.conversation ||
                msg.message?.extendedTextMessage?.text ||
                "";

            const content = text
                .replace(/^\.?استطلاع\s*/i, "")
                .trim();

            let question;
            let options;

            const quoted =
                msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            // ===== إذا كان هناك رد على رسالة =====
            if (quoted) {
                question =
                    quoted.conversation ||
                    quoted.extendedTextMessage?.text ||
                    quoted.imageMessage?.caption ||
                    quoted.videoMessage?.caption ||
                    quoted.documentMessage?.caption ||
                    "📊 استطلاع رأي";

                options = content
                    .split("+")
                    .map(v => v.trim())
                    .filter(Boolean);

            } else {
                // ===== صيغة مباشرة: استطلاع هل البوت جيد؟ + نعم + لا =====
                const parts = content
                    .split("+")
                    .map(v => v.trim())
                    .filter(Boolean);

                if (parts.length < 3) {
                    await sendMessage(sock, chatId, [
                        '❌ *طريقة الاستخدام:*',
                        '',
                        '📌 *مباشرة:*',
                        '   استطلاع هل البوت جيد؟ + نعم ✅ + لا ❌',
                        '',
                        '📌 *بالرد على رسالة:*',
                        '   استطلاع نعم ✅ + لا ❌',
                        '',
                        '⚠️ يجب أن يكون هناك خياران على الأقل',
                        '⚠️ الحد الأقصى للخيارات هو 12'
                    ], msg);
                    return;
                }

                question = parts.shift();
                options = parts;
            }

            // ===== التحقق من الخيارات =====
            if (!options || options.length < 2) {
                await sendMessage(sock, chatId, [
                    '❌ يجب كتابة خيارين على الأقل',
                    '',
                    '📌 مثال: `.استطلاع هل تحب البوت؟ + نعم + لا`'
                ], msg);
                return;
            }

            if (options.length > 12) {
                await sendMessage(sock, chatId, [
                    '❌ الحد الأقصى للخيارات هو 12'
                ], msg);
                return;
            }

            // ===== إرسال الاستطلاع =====
            await sock.sendMessage(
                chatId,
                {
                    poll: {
                        name: `📊 ${question}`,
                        values: options,
                        selectableCount: 1
                    }
                },
                { quoted: msg }
            );

        } catch (error) {
            console.error("❌ خطأ في أمر استطلاع:", error);
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