// ذكوره.js - نسبة الذكورة (نسخة محسنة بدون خطوط)
module.exports = {
    command: ['ذكوره', 'ذكورة'],
    description: '🧔 نسبة الذكورة لك أو لصديقك',
    usage: '.ذكوره [@منشن]',
    category: 'تسلية',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            let targetJid;

            // تحديد الهدف
            if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid &&
                msg.message.extendedTextMessage.contextInfo.mentionedJid.length > 0) {
                targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
                targetJid = msg.message.extendedTextMessage.contextInfo.participant;
            } else {
                targetJid = msg.key.participant || msg.key.remoteJid;
            }

            // التأكد من صيغة الـ JID
            if (!targetJid.includes('@')) {
                targetJid = `${targetJid}@s.whatsapp.net`;
            }

            const percentage = Math.floor(Math.random() * 101);
            const targetId = targetJid.split('@')[0];

            // ========== تحليل النسبة ==========
            let level = '';
            let emoji = '';
            let comment = '';
            let advice = '';

            if (percentage >= 90) {
                level = 'أسطورة الرجولة 🦁';
                emoji = '👑';
                comment = 'رجل بمعنى الكلمة! تحمل المسؤولية والتضحية';
                advice = 'قدوة للرجال، استمر في هذا النهج';
            } else if (percentage >= 70) {
                level = 'رجل قوي 💪';
                emoji = '⚔️';
                comment = 'رجولة عالية جداً، شخصية قوية ومؤثرة';
                advice = 'زود من ثقتك بنفسك أكثر';
            } else if (percentage >= 50) {
                level = 'رجل متوسط 🦾';
                emoji = '🤝';
                comment = 'نسبة ذكورة جيدة، لكن هناك مجال للتطوير';
                advice = 'كن أكثر حزماً في قراراتك';
            } else if (percentage >= 30) {
                level = 'ضعيف الشخصية 🥀';
                emoji = '😅';
                comment = 'نسبة ذكورة منخفضة، تحتاج إلى تعزيز ثقتك';
                advice = 'ابدأ بتحمل المسؤوليات الصغيرة';
            } else {
                level = 'محتاج تطوير 🌱';
                emoji = '🤭';
                comment = 'نسبة ذكورة ضعيفة جداً، حان وقت التغيير';
                advice = 'تواصل مع رجال أقوياء وتعلم منهم';
            }

            // ========== إرسال النتيجة ==========
            const lines = [
                '',
                `👤 المستهدف: @${targetId}`,
                `📊 النسبة: ${percentage}% ${emoji}`,
                `🏅 المستوى: ${level}`,
                `🗣️ ${comment}`,
                `💡 نصيحة: ${advice}`,
                '',
                `📌 تقييم ${percentage >= 50 ? 'إيجابي ✅' : 'سلبي ❌'}`
            ];

            let msgText = `🧔 نـسـبـة الـذكـورة 🧔\n`;
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            for (const line of lines) {
                msgText += `${line}\n`;
            }
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            msgText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

            await sock.sendMessage(chatId, {
                text: msgText,
                mentions: [targetJid]
            }, { quoted: msg });

        } catch (error) {
            console.error('✗ خطأ في أمر ذكوره:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ حدث خطأ أثناء تنفيذ الأمر.'
            }, { quoted: msg });
        }
    }
};