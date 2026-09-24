// بريفكس.js - تغيير البريفكس الخاص بالأوامر (للأونر والمؤسس فقط)

const fs = require('fs');
const path = require('path');
const config = require('./config');

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🔧 تـغـيـيـر الـبـريـفـكـس 🔧\n`;
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
    command: 'بريفكس',
    description: '🔧 تغيير البريفكس الخاص بالأوامر (للأونر فقط)',
    usage: '.بريفكس [رمز جديد] أو .بريفكس فارغ',
    category: 'نظام',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const senderJid = msg.key.participant || msg.key.remoteJid;
            const sender = senderJid.split('@')[0];

            // ===== التحقق من الصلاحيات =====
            const { isOwnerbot, isFounder } = require('./lib-roles');
            
            if (!(isOwnerbot(sender) || isFounder(sender))) {
                await sendMessage(sock, chatId, [
                    '🚫 *غير مصرح*',
                    '',
                    '🔒 هذا الأمر خاص فقط للأونر.',
                    '📌 لا يمكن لأي شخص آخر استخدامه'
                ], msg);
                return;
            }

            // ===== استخراج النص =====
            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            
            // الحصول على البريفكس الحالي
            const currentPrefix = config.prefix || '';

            let input = '';

            // استخراج الأمر من النص
            if (currentPrefix && fullText.startsWith(currentPrefix + 'بريفكس')) {
                input = fullText.slice((currentPrefix + 'بريفكس').length).trim();
            } else if (currentPrefix === '' && fullText.startsWith('بريفكس')) {
                input = fullText.slice('بريفكس'.length).trim();
            } else {
                // محاولة أخرى
                const match = fullText.match(/\.?بريفكس\s+(.+)/);
                if (match) input = match[1].trim();
            }

            if (!input) {
                const examplePrefix = currentPrefix || 'بريفكس';
                await sendMessage(sock, chatId, [
                    '❌ *يرجى كتابة البريفكس الجديد.*',
                    '',
                    '📌 *أمثلة:*',
                    `   ${examplePrefix} $`,
                    `   ${examplePrefix} فارغ`,
                    `   ${examplePrefix} .`,
                    '',
                    '📝 *ملاحظة:*',
                    '   • اكتب `فارغ` لإزالة البريفكس',
                    '   • اكتب `.` لإعادة البريفكس الافتراضي'
                ], msg);
                return;
            }

            // ===== تحديد البريفكس الجديد =====
            let newPrefix;
            if (input === 'فارغ') {
                newPrefix = '';
            } else if (input === '.') {
                newPrefix = '.';
            } else {
                newPrefix = input;
            }

            // ===== تحديث البريفكس =====
            config.prefix = newPrefix;

            // حفظ التغيير في ملف config إذا كان مطلوباً (اختياري)
            try {
                const envPath = path.join(__dirname, '.env');
                if (fs.existsSync(envPath)) {
                    let envContent = fs.readFileSync(envPath, 'utf8');
                    if (/^BOT_PREFIX=.*$/m.test(envContent)) {
                        envContent = envContent.replace(/^BOT_PREFIX=.*$/m, `BOT_PREFIX=${newPrefix}`);
                    } else {
                        envContent += `\nBOT_PREFIX=${newPrefix}\n`;
                    }
                    fs.writeFileSync(envPath, envContent);
                }
            } catch (e) {
                console.log('⚠️ تعذر حفظ البريفكس في الملف:', e.message);
            }

            // ===== بناء رسالة النجاح =====
            const display = newPrefix === '' ? 'فارغ' : `"${newPrefix}"`;
            const lines = [
                `✅ *تم تغيير البريفكس إلى ${display}*`
            ];

            if (newPrefix === '') {
                lines.push('');
                lines.push('⚠️ الآن يمكنك استخدام الأوامر بدون بريفكس');
                lines.push('📝 لإعادة البريفكس: اكتب `بريفكس .`');
            } else if (newPrefix === '.') {
                lines.push('');
                lines.push('✅ تم إعادة البريفكس الافتراضي');
            }

            lines.push('');
            lines.push('🔄 التحديث فوري ولا يحتاج إعادة تشغيل');

            await sendMessage(sock, chatId, lines, msg);

        } catch (error) {
            console.error('❌ خطأ في أمر بريفكس:', error);
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