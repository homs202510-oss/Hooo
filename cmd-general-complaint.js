// شكوى.js - إرسال شكوى للمطور مع رابط الجروب ومهلة 10 دقائق
const fs = require('fs');
const path = require('path');

// ========== ملف تخزين وقت آخر شكوى ==========
const cooldownFile = path.join(__dirname, 'db-complaint_cooldown.json');
const COOLDOWN_MINUTES = 10; // مدة الانتظار بالدقائق
const COOLDOWN_MS = COOLDOWN_MINUTES * 60 * 1000;

function loadCooldowns() {
    if (!fs.existsSync(cooldownFile)) {
        fs.writeFileSync(cooldownFile, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(cooldownFile));
}

function saveCooldowns(data) {
    fs.writeFileSync(cooldownFile, JSON.stringify(data, null, 2));
}

// ========== جلب رابط الجروب ==========
async function getGroupLink(sock, groupId) {
    try {
        // الحصول على كود الدعوة
        const code = await sock.groupInviteCode(groupId);
        return `https://chat.whatsapp.com/${code}`;
    } catch (error) {
        console.error('❌ فشل جلب رابط الجروب:', error.message);
        return 'غير متاح (قد لا يكون البوت مشرفاً)';
    }
}

module.exports = {
    command: ['شكوى', 'بلاغ', 'ابلاغ'],
    description: '📩 إرسال شكوى للمطور (مهلة 10 دقائق بين كل شكوى)',
    category: 'عام',
    usage: '.شكوى [نص الشكوى]',

    async execute(sock, msg) {
        try {
            const ownerNumber = require('./config').ownerNumber + '@s.whatsapp.net';

            const chatId = msg.key.remoteJid;
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            // ===== التحقق من المهلة =====
            const cooldowns = loadCooldowns();
            const lastTime = cooldowns[sender] || 0;
            const now = Date.now();

            if (lastTime && (now - lastTime) < COOLDOWN_MS) {
                const remaining = Math.ceil((COOLDOWN_MS - (now - lastTime)) / 60000);
                const lines = [
                    '⏳ *مهلة الانتظار*',
                    '',
                    `يجب الانتظار ${remaining} دقيقة قبل إرسال شكوى أخرى.`,
                    '',
                    '📌 تم إرسال شكوى سابقة مؤخراً.'
                ];
                
                let msgText = `📩 شـكـوى 📩\n`;
                msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
                for (const line of lines) {
                    msgText += `${line}\n`;
                }
                msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
                msgText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
                
                await sock.sendMessage(chatId, { text: msgText }, { quoted: msg });
                return;
            }

            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(' ').slice(1);

            if (!args.length) {
                const lines = [
                    '📩 *إرسال شكوى*',
                    '',
                    '📌 الاستخدام:',
                    '.شكوى [نص الشكوى]',
                    '',
                    '📝 مثال:',
                    '.شكوى البوت لا يعمل',
                    '',
                    `⏳ المهلة: ${COOLDOWN_MINUTES} دقائق بين كل شكوى`
                ];
                
                let msgText = `📩 شـكـوى 📩\n`;
                msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
                for (const line of lines) {
                    msgText += `${line}\n`;
                }
                msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
                msgText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
                
                await sock.sendMessage(chatId, { text: msgText }, { quoted: msg });
                return;
            }

            const complaint = args.join(' ');

            // ===== جمع معلومات الجروب =====
            let groupName = 'خاص';
            let groupLink = 'غير متاح (محادثة خاصة)';
            let isGroup = false;

            if (chatId.endsWith('@g.us')) {
                isGroup = true;
                try {
                    const metadata = await sock.groupMetadata(chatId);
                    groupName = metadata.subject || 'غير معروف';
                    // جلب رابط الجروب
                    groupLink = await getGroupLink(sock, chatId);
                } catch (e) {
                    console.log('خطأ في جلب بيانات الجروب:', e);
                    groupName = 'غير معروف';
                    groupLink = 'غير متاح (حدث خطأ)';
                }
            }

            const userName = msg.pushName || sender.split('@')[0];
            const nowDate = new Date();
            const date = nowDate.toLocaleDateString('ar-EG');
            const time = nowDate.toLocaleTimeString('ar-EG');

            // ===== رسالة الشكوى للمطور =====
            const report = `📩 *شكوى جديدة*
━━━━━━━━━━━━━━━━━━━━
👤 المشتكي: @${sender.split('@')[0]}
📝 الاسم: ${userName}
🏷️ الجروب: ${groupName}
🔗 رابط الجروب: ${groupLink}
🆔 المعرف: ${sender}
💬 المحادثة: ${chatId}

📨 *الشكوى:*
${complaint}

📅 التاريخ: ${date}
🕒 الوقت: ${time}
━━━━━━━━━━━━━━━━━━━━
𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

            await sock.sendMessage(ownerNumber, {
                text: report,
                mentions: [sender]
            });

            // ===== تحديث وقت آخر شكوى =====
            cooldowns[sender] = now;
            saveCooldowns(cooldowns);

            const lines = [
                '✅ تم إرسال شكواك إلى المطور بنجاح.',
                '',
                '📌 سيتم الرد عليك قريباً',
                '',
                `⏳ يمكنك إرسال شكوى أخرى بعد ${COOLDOWN_MINUTES} دقائق.`
            ];
            
            let msgText = `📩 شـكـوى 📩\n`;
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            for (const line of lines) {
                msgText += `${line}\n`;
            }
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            msgText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

            await sock.sendMessage(chatId, { text: msgText }, { quoted: msg });

        } catch (err) {
            console.error('✗ خطأ في أمر شكوى:', err);

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: '❌ حدث خطأ أثناء إرسال الشكوى.'
                },
                { quoted: msg }
            );
        }
    }
};