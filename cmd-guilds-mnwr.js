// منور.js - ترحيب فاخر (نسخة بدون خطوط مع دمج القوالب)
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ========== قائمة رسائل الترحيب العشوائية ==========
const welcomeMessages = [
    '🌟 نورت المكان / الجروب بحضورك المبهر',
    '💫 وجودك عندنا مو بس شرف… هذا نور طال المكان كله',
    '✨ نتمنى لك أوقات ممتعة وتفاعل أسطوري',
    '🎊 وجودك يضيف لنا هيبة وقيمة ورونق مختلف',
    '🎈 المكان مكانك… والكلمة كلمتك'
];

function getRandomWelcome() {
    return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
}

// ========== cooldown ==========
const cooldown = new Map();

module.exports = {
    command: 'منور',
    description: 'ترحيب فاخر مع صورة بروفايل',
    usage: '.منور @العضو اللقب  أو بالرد على رسالة',
    category: 'نقابات',
    group: true,

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            // Cooldown 10 ثواني
            if (cooldown.has(sender)) {
                const timeLeft = (cooldown.get(sender) - Date.now()) / 1000;
                if (timeLeft > 0) {
                    return await sock.sendMessage(chatId, {
                        text: `⏳ استنى شوية (${Math.ceil(timeLeft)} ثواني) قبل ما تستخدم الأمر تاني.`
                    }, { quoted: msg });
                }
            }
            cooldown.set(sender, Date.now() + 10000);

            // استخراج النص والأمر
            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/).slice(1);
            const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
            const mentionedJid = contextInfo.mentionedJid || [];
            const quotedParticipant = contextInfo.participant || null;

            let targetJid = null;
            let nickname = '';

            // تحديد الهدف
            if (mentionedJid.length > 0) {
                targetJid = mentionedJid[0];
                const mentionIndex = fullText.indexOf(`@${targetJid.split('@')[0]}`);
                if (mentionIndex !== -1) {
                    const afterMention = fullText.slice(mentionIndex + targetJid.split('@')[0].length + 1).trim();
                    nickname = afterMention;
                }
            } else if (quotedParticipant) {
                targetJid = quotedParticipant;
                nickname = args.join(' ');
            } else if (args.length > 0) {
                const possibleNumber = args[0].replace(/[^0-9]/g, '');
                if (possibleNumber && possibleNumber.length >= 8) {
                    targetJid = possibleNumber + '@s.whatsapp.net';
                    nickname = args.slice(1).join(' ');
                }
            }

            if (!targetJid) {
                return await sock.sendMessage(chatId, {
                    text: '⚠️ الاستخدام:\n.منور @العضو اللقب\nأو بالرد على رسالة الشخص.'
                }, { quoted: msg });
            }

            if (!nickname || nickname.trim() === '') {
                nickname = 'ملك الظلال';
            }

            // جلب اسم المجموعة
            let groupName = 'الجروب';
            if (chatId.endsWith('@g.us')) {
                try {
                    const metadata = await sock.groupMetadata(chatId);
                    groupName = metadata.subject || groupName;
                } catch {}
            }

            // جلب صورة البروفايل
            let profilePicBuffer = null;
            try {
                const pfpUrl = await sock.profilePictureUrl(targetJid, 'image');
                const response = await axios.get(pfpUrl, { responseType: 'arraybuffer' });
                profilePicBuffer = Buffer.from(response.data);
            } catch (e) {
                // لا صورة
            }

            const randomWelcome = getRandomWelcome();
            const targetTag = `@${targetJid.split('@')[0]}`;

            // ===== بناء النص بدون خطوط =====
            const caption = `
╔═━━━━◥◣◆◢◤━━━━═╗
      ✨🎉 أهــــــلاً بـك 🎉✨
╚═━━━━◥◣◆◢◤━━━━═╝

🌟 نورت الجروب بحضورك المبهر
💫 وجودك عندنا مو بس شرف… هذا نور طال المكان كله
✨ نتمنى لك أوقات ممتعة وتفاعل أسطوري
🎊 وجودك يضيف لنا هيبة وقيمة ورونق مختلف
🎈 المكان مكانك… والكلمة كلمتك

╭───────────────╮
    👤 *معلومات العضو*
╰───────────────╯

🔹 المنشن: ${targetTag}
🔹 اللقب: ${nickname}
🔹 تاريخ الدخول: اليوم ✨
🔹 الرتبة: عضو جديد مُرحَّب به 🫶🔥

╭─═══ 『 ⚜️ ملاحظات مهمة ⚜️ 』═══─╮
✔️ خليك محترم مع الجميع
✔️ تفاعل وخليك من أهل البيت
✔️ أي مشكلة… الإدارة فوق راسك
╰─════════════════════─╯

💌 نشوفك متفاعل مثل نورك، ولا تحرمنا وجودك
      𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️
`.trim();

            // ===== إرسال =====
            if (profilePicBuffer) {
                try {
                    await sock.sendMessage(chatId, {
                        image: profilePicBuffer,
                        caption: caption,
                        mentions: [targetJid]
                    }, { quoted: msg });
                } catch (err) {
                    // في حال فشل إرسال الصورة، نرسل نصاً فقط
                    await sock.sendMessage(chatId, {
                        text: caption,
                        mentions: [targetJid]
                    }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(chatId, {
                    text: caption,
                    mentions: [targetJid]
                }, { quoted: msg });
            }

        } catch (err) {
            console.error('❌ خطأ في أمر منور:', err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚠️ حدث خطأ: ${err.message || 'خطأ غير معروف'}`
            }, { quoted: msg });
        }
    }
};