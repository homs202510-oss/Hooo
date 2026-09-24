// جروب.js - إنشاء جروب متطور مع صورة البوت (بدون خطوط)
const dev = require('./lib-roles');
const { jidDecode } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

// ========== تحويل إلى LID ==========
function toLid(jid) {
    if (!jid) return null;
    return jid.split('@')[0] + '@lid';
}

// ========== التحقق من الصلاحيات ==========
function isAuthorized(jid) {
    const sender = toLid(jid);
    return (
        dev.isFounder(sender) ||
        dev.isOwnerbot(sender) ||
        dev.isDeveloper(sender)
    );
}

// ========== الحصول على JID البوت ==========
const getBotJid = (id) => {
    const data = jidDecode(id);
    const user = data?.user || id.split('@')[0];
    return user + '@s.whatsapp.net';
};

// ========== دوال مساعدة للتواريخ ==========
function getCurrentDate() {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function getCurrentTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ========== قائمة الأسماء العشوائية للجروبات ==========
const groupNames = [
    '🏰 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑲𝑰𝑵𝑮𝑫𝑶𝑴',
    '⚡ 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻 𝑬𝑴𝑷𝑰𝑹𝑬',
    '🔥 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑫𝑬𝑽𝑬𝑳𝑶𝑷𝑬𝑹𝑺',
    '💎 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑨𝑹𝑴𝒀',
    '🦅 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑵𝑨𝑻𝑰𝑶𝑵',
    '🌊 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑭𝑳𝑨𝑮𝑺𝑯𝑰𝑷',
    '🎮 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑮𝑨𝑴𝑰𝑵𝑮',
    '🌟 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑬𝑿𝑪𝑳𝑼𝑺𝑰𝑽𝑬'
];

function getRandomGroupName() {
    return groupNames[Math.floor(Math.random() * groupNames.length)];
}

// ========== البحث عن صورة البوت (مرن) ==========
function getBotImage() {
    const possibleNames = ['image', 'bot', 'profile', 'avatar', 'pbot'];
    const extensions = ['.jpeg', '.jpg', '.png', '.webp', '.gif'];
    const searchDirs = [
        path.join(__dirname, '..', 'resources'),
        path.join(__dirname, '..', 'assets'),
        __dirname,
        path.join(__dirname, '..')
    ];

    for (const dir of searchDirs) {
        if (!fs.existsSync(dir)) continue;
        for (const name of possibleNames) {
            for (const ext of extensions) {
                const filePath = path.join(dir, name + ext);
                if (fs.existsSync(filePath)) {
                    console.log(`✅ تم العثور على الصورة: ${filePath}`);
                    return fs.readFileSync(filePath);
                }
            }
        }
    }
    console.warn('⚠️ لم يتم العثور على صورة للبوت');
    return null;
}

module.exports = {
    command: 'جروب',
    category: 'نقابات',
    description: 'إنشاء جروب متطور مع صورة البوت (للمطورين فقط)',
    usage: '.جروب [اسم الجروب]  أو .جروب (للاسم عشوائي)',

    async execute(sock, msg) {
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const senderNumber = sender.split('@')[0];
            const chatId = msg.key.remoteJid;

            // ===== التحقق من الصلاحيات =====
            if (!isAuthorized(sender)) {
                return sock.sendMessage(chatId, {
                    text: '❌ هذا الأمر خاص بالمطورين فقط'
                }, { quoted: msg });
            }

            // ===== استخراج اسم الجروب =====
            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/).slice(1);
            let groupName = args.join(' ') || getRandomGroupName();

            if (!groupName.match(/^[🏰⚡🔥💎🦅🌊🎮🌟]/)) {
                groupName = '🔥 ' + groupName;
            }

            // ===== إنشاء الجروب =====
            const botJid = getBotJid(sock.user.id);
            const group = await sock.groupCreate(groupName, [botJid]);
            const groupId = group.id;

            // ===== إنشاء رابط الدعوة =====
            const inviteCode = await sock.groupInviteCode(groupId);
            const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

            // ===== إعداد البيانات =====
            const date = getCurrentDate();
            const time = getCurrentTime();
            const metadata = await sock.groupMetadata(groupId);
            const finalName = metadata.subject;

            // ===== بناء الوصف =====
            const description = `─ [ ⌬ 𝑷𝑯𝑨𝑵𝑻𝑶𝑴 𝑩𝑶𝑻 ⌬ ] ─
🌟 الاسم: ${finalName}
✨ جروب رسمي للتجربة والمغامرات الرقمية
💡 استكشف، تعلم، وتفاعل مع كل جديد
🏆 شارك في فعاليات ممتعة ومسابقات تفاعلية
🛡️ حماية كاملة لضمان بيئة آمنة ومرنة
⚡ أسرع بوت تفاعلي مع تجربة سلسة وذكية
👑 مطور البوت: 🇪🇬 حمص ~ +${require('./config').ownerNumber} 🖋️
📦 عدد الأوامر: 350+
⏱️ التاريخ: ${date} - ${time}
🔗 الرابط:
${inviteLink}
──────────────────`;

            // ===== تحديث وصف المجموعة =====
            await sock.groupUpdateDescription(groupId, description);

            // ===== إضافة صورة البوت للجروب =====
            const botImage = getBotImage();
            let imageStatus = '';

            if (botImage) {
                try {
                    await sock.updateProfilePicture(groupId, botImage);
                    imageStatus = '🖼️ تم تعيين صورة البوت';
                } catch (imgErr) {
                    console.warn('⚠️ فشل تحديث صورة الجروب:', imgErr.message);
                    imageStatus = '⚠️ فشل تعيين الصورة';
                }
            } else {
                imageStatus = '⚠️ لم يتم العثور على صورة للبوت (ضع صورة باسم image.jpeg في الفولدر)';
            }

            // ===== بناء الرسالة النهائية =====
            const finalMessage = `
👤 @${senderNumber}
✅ تم إنشاء الجروب بنجاح

📛 الاسم: ${finalName}
🆔 المعرف: ${groupId}
🔗 الرابط:
${inviteLink}

📅 التاريخ: ${date}
🕐 الوقت: ${time}
📦 الأوامر: 2300+
${imageStatus}

📋 الوصف:
${description}

𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

            await sock.sendMessage(chatId, {
                text: finalMessage,
                mentions: [sender]
            }, { quoted: msg });

        } catch (err) {
            console.error('❌ خطأ في أمر جروب:', err);
            let errorMessage = '❌ فشل إنشاء الجروب:';
            if (err.message?.includes('not-authorized')) {
                errorMessage += '\n⚠️ البوت ليس لديه صلاحية إنشاء جروبات';
            } else {
                errorMessage += `\n📛 ${err.message || err}`;
            }
            await sock.sendMessage(msg.key.remoteJid, {
                text: errorMessage
            }, { quoted: msg });
        }
    }
};