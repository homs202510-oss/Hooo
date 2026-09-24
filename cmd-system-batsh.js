// باتش.js - جلب ملفات الإضافات (للمطورين فقط)

const fs = require('fs');
const path = require('path');
const hay = require('./lib-roles');

// ========== دالة حساب المسافة بين الكلمات (Levenshtein Distance) ==========
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

// ========== دالة إيجاد أقرب اسم ملف ==========
function findClosestMatch(input, options, maxDistance = 3) {
    let closest = null;
    let minDistance = Infinity;

    for (const option of options) {
        const distance = levenshteinDistance(input.toLowerCase(), option.toLowerCase());
        if (distance < minDistance && distance <= maxDistance) {
            minDistance = distance;
            closest = option;
        }
    }

    return closest;
}

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `📁 مـلـفـات الـبـوت 📁\n`;
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

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['باتش', 'ملف'],
    description: '📁 جلب ملف من مجلد الإضافات بالاسم أو الرقم.',
    category: 'نظام',
    usage: '.باتش [اسم الملف أو رقمه]',

    async execute(sock, msg) {
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const chatId = msg.key.remoteJid;

            if (!sender || !chatId) return;

            const senderLid = hay.toLid(sender);

            // ===== التحقق من صلاحيات المطور =====
            if (!(hay.isFounder(senderLid) || hay.isOwnerbot(senderLid) || hay.isDeveloper(senderLid))) {
                await sendMessage(sock, chatId, [
                    '❌ *غير مصرح*',
                    '',
                    '🔒 هذا الأمر مخصص للمطور فقط.'
                ], msg);
                return;
            }

            // ===== قراءة الملفات من مجلد الإضافات =====
            const pluginsDir = path.resolve('./plugins');
            if (!fs.existsSync(pluginsDir)) {
                await sendMessage(sock, chatId, [
                    '❌ *مجلد الإضافات غير موجود*',
                    '',
                    '📌 تأكد من وجود مجلد `plugins`'
                ], msg);
                return;
            }

            const pluginFiles = fs.readdirSync(pluginsDir)
                .filter(file => file.endsWith('.js') && !file.startsWith('_'));

            if (pluginFiles.length === 0) {
                await sendMessage(sock, chatId, [
                    '📭 *لا توجد ملفات إضافات*',
                    '',
                    '📌 مجلد `plugins` فارغ'
                ], msg);
                return;
            }

            const pluginNames = pluginFiles.map(v => v.replace('.js', ''));

            // ===== استخراج النص =====
            const fullText =
                msg.message?.conversation ||
                msg.message?.extendedTextMessage?.text ||
                '';

            const commandName = fullText.split(' ')[0]?.toLowerCase();
            const inputText = fullText.slice(commandName.length).trim();

            // ===== عرض القائمة (بدون إدخال) =====
            if (!inputText) {
                const pluginList = pluginNames.map((v, index) =>
                    `   ${(index + 1).toString().padStart(2)}. ${v}`
                ).join('\n');

                const lines = [
                    `📁 *قائمة ملفات البوت*`,
                    '',
                    `📊 الإجمالي: ${pluginNames.length} ملف`,
                    '',
                    pluginList,
                    '',
                    '✍️ أرسل *الرقم* أو *الاسم* للحصول على الملف.',
                    '',
                    '📝 مثال: `.باتش 3` أو `.باتش تصنيف`'
                ];

                await sendMessage(sock, chatId, lines, msg);
                return;
            }

            // ===== تحديد الملف المطلوب =====
            let selectedPlugin = '';

            // إذا كان الإدخال رقماً
            if (/^\d+$/.test(inputText)) {
                const index = parseInt(inputText) - 1;
                if (index >= 0 && index < pluginNames.length) {
                    selectedPlugin = pluginNames[index];
                } else {
                    await sendMessage(sock, chatId, [
                        `⚠️ *الرقم غير صحيح*`,
                        '',
                        `📌 الرجاء إدخال رقم بين 1 و ${pluginNames.length}`
                    ], msg);
                    return;
                }
            } else {
                // إذا كان الإدخال اسماً
                if (pluginNames.includes(inputText)) {
                    selectedPlugin = inputText;
                } else {
                    const closestMatch = findClosestMatch(inputText, pluginNames);

                    let reply = [
                        `⚠️ *الملف "${inputText}" غير موجود!*`
                    ];
                    if (closestMatch) {
                        reply.push('');
                        reply.push(`🔎 ربما تقصد: *${closestMatch}*`);
                    }
                    reply.push('');
                    reply.push('📂 استخدم الأمر بدون اسم لعرض القائمة.');

                    await sendMessage(sock, chatId, reply, msg);
                    return;
                }
            }

            // ===== إرسال الملف =====
            const filePath = path.join(pluginsDir, `${selectedPlugin}.js`);
            if (!fs.existsSync(filePath)) {
                await sendMessage(sock, chatId, [
                    `❌ *الملف "${selectedPlugin}.js" غير موجود*`
                ], msg);
                return;
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            const fileBuffer = fs.readFileSync(filePath);

            // ===== إرسال الملف كملف =====
            await sock.sendMessage(chatId, {
                document: fileBuffer,
                mimetype: 'application/javascript',
                fileName: `${selectedPlugin}.js`
            }, { quoted: msg });

            // ===== إرسال المحتوى كـ نص (مقسم لأجزاء) =====
            const maxChars = 4000;
            const chunks = content.match(new RegExp(`[\\s\\S]{1,${maxChars}}`, 'g')) || [];

            for (let i = 0; i < chunks.length; i++) {
                const lines = [
                    `📄 *${selectedPlugin}.js* (جزء ${i + 1}/${chunks.length}):`,
                    '',
                    '```javascript',
                    chunks[i],
                    '```'
                ];
                await sendMessage(sock, chatId, lines, msg);
            }

        } catch (error) {
            console.error('❌ خطأ في أمر باتش:', error);
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