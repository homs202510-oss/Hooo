// ريستارت.js - إعادة تشغيل البوت (للمطورين فقط)

const { jidDecode } = require('@whiskeysockets/baileys');
const chalk = require('chalk');
const { spawn } = require('child_process');
const hay = require('./lib-roles');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

// ✅ دالة تحويل إلى LID (بديلة لـ toLid)
function getLid(number) {
    if (!number) return null;
    if (number.includes('@lid')) return number;
    if (number.includes('@s.whatsapp.net')) {
        return number.split('@')[0] + '@lid';
    }
    return number + '@lid';
}

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🔄 إعـادة تـشـغـيـل الـبـوت 🔄\n`;
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
    command: ['ريستارت', 'رستر'],
    description: '🔄 إعادة تشغيل البوت (للمطورين والأونر فقط)',
    category: 'نظام',
    usage: '.ريستارت',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = decode(msg.key.participant || msg.key.remoteJid);
            const senderLid = getLid(sender);

            // ===== التحقق من الصلاحيات =====
            if (!(hay.isFounder(senderLid) || hay.isOwnerbot(senderLid) || hay.isDeveloper(senderLid))) {
                await sendMessage(sock, chatId, [
                    '🚫 *غير مصرح*',
                    '',
                    '🔒 هذا الأمر مخصص للمطورين والأونر فقط.',
                    '📌 لا يمكن لأي شخص آخر استخدامه'
                ], msg);
                return;
            }

            // ===== رسالة التأكيد =====
            const senderNumber = sender.split('@')[0];
            const lines = [
                `🔄 *جاري إعادة تشغيل البوت...*`,
                '',
                '⏳ سيتم إعادة التشغيل خلال ثوانٍ...',
                '💡 سيعود البوت للعمل تلقائياً'
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

            // ===== تسجيل في الكونسول =====
            console.log(
                '\n' + chalk.bgYellow.black.bold('[ System ]'),
                '🔄',
                chalk.bgHex('#FFD700').black(` Bot restart initiated by developer (${senderLid})`)
            );

            // ===== تنفيذ إعادة التشغيل =====
            // إذا كان البوت يعمل تحت PM2
            if (process.send) {
                process.send('reset');
            } else {
                // إعادة تشغيل يدوي
                spawn(process.argv[0], process.argv.slice(1), {
                    detached: true,
                    stdio: 'inherit'
                });
            }

            // إنهاء العملية الحالية
            setTimeout(() => {
                process.exit(0);
            }, 1000);

        } catch (error) {
            console.error('❌ خطأ في أمر ريستارت:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ *حدث خطأ أثناء إعادة التشغيل*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};