// ولاء.js - تحليل نسبة ولاء العضو لسيده (نسخة بدون خطوط)
module.exports = {
    command: 'ولاء',
    description: '🧎‍♂️ نسبة ولاء العضو لسيده',
    usage: '.ولاء @العضو | رد على رسالة',
    category: 'تسلية',

    async execute(sock, msg) {
        try {
            const remoteJid = msg.key.remoteJid;
            const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

            let targetJid;

            // 1️⃣ منشن
            if (contextInfo?.mentionedJid && contextInfo.mentionedJid.length > 0) {
                targetJid = contextInfo.mentionedJid[0];
            }
            // 2️⃣ رد على رسالة
            else if (contextInfo?.participant) {
                targetJid = contextInfo.participant;
            }
            // 3️⃣ صاحب الرسالة (نفسه)
            else {
                targetJid = msg.key.participant || msg.key.remoteJid;
            }

            // لو خاص
            if (!targetJid.includes('@')) {
                targetJid = `${targetJid}@s.whatsapp.net`;
            }

            const userId = targetJid.split('@')[0];

            // توليد نسبة ولاء عشوائية
            const baseLoyalty = Math.floor(Math.random() * 101);
            const bonus = Math.floor(Math.random() * 10) - 5;
            const loyalty = Math.min(100, Math.max(0, baseLoyalty + bonus));

            let comment = '';
            let emoji = '';

            if (loyalty >= 95) {
                comment = '🛐 عبد وفيّ من الدرجة الأولى، يستحق وسام الإخلاص!';
                emoji = '👑';
            } else if (loyalty >= 80) {
                comment = '🤝 ولاءه عالي جداً، لكن ساعات بيزوغ لما يكون جوعان.';
                emoji = '💎';
            } else if (loyalty >= 60) {
                comment = '😐 لسانه مع سيده، بس قلبه مشغول بالماكينة!';
                emoji = '🤔';
            } else if (loyalty >= 40) {
                comment = '👀 بيأكل مع الأعداء وبيضحك للسيد، خطير!';
                emoji = '😬';
            } else if (loyalty >= 20) {
                comment = '🥖 خاين على قد كسرة عيش، ما يضمنش!';
                emoji = '💔';
            } else {
                comment = '🚨 هذا العبد خان سيده عشان اتنين كركديه!';
                emoji = '🔥';
            }

            const message = `🧎‍♂️ تـحـلـيـل الـولاء 🧎‍♂️
━━━━━━━━━━━━━━━━━━━━
👤 المستهدف: @${userId}
📊 نسبة الولاء: ${loyalty}% ${emoji}
🗣️ ${comment}
━━━━━━━━━━━━━━━━━━━━
𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

            await sock.sendMessage(remoteJid, {
                text: message,
                mentions: [targetJid]
            }, { quoted: msg });

        } catch (error) {
            console.error('✗ خطأ في أمر الولاء:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ حدث خطأ أثناء تنفيذ الأمر.'
            }, { quoted: msg });
        }
    }
};