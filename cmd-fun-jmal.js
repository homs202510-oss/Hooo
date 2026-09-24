// جمال.js - نسبة الجمال عندك أو عند شخص آخر (نسخة محسنة بدون خطوط)
module.exports = {
    command: ['جمال', 'جمالي'],
    description: '💅 نسبة الجمال عندك أو عند شخص آخر',
    usage: '.جمال [@منشن] | .جمال (رد على رسالة)',
    category: 'تسلية',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            let targetJid;

            // تحديد الهدف (منشن أو رد)
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
            const senderId = (msg.key.participant || msg.key.remoteJid).split('@')[0];

            // ========== تحليل النسبة ==========
            let level = '';
            let emoji = '';
            let comment = '';
            let advice = '';

            if (percentage >= 95) {
                level = 'ملكة/ملك الجمال 👑';
                emoji = '👑';
                comment = 'جمال خارق للطبيعة! أنت أجمل من القمر 🌙';
                advice = 'استمر في إشراقك، أنت مصدر إلهام للجميع ✨';
            } else if (percentage >= 80) {
                level = 'نجم/نجمة ساحرة ⭐';
                emoji = '⭐';
                comment = 'جمالك يخطف الأنفاس، الجاذبية عنوانك 💫';
                advice = 'ابتسم دائماً، جمالك يزداد بابتسامتك 😊';
            } else if (percentage >= 60) {
                level = 'جميل/جميلة جداً 💎';
                emoji = '💎';
                comment = 'نسبة جمال عالية، أنت ملفت للانتباه 👀';
                advice = 'الثقة بالنفس تزيد من جمالك، كن واثقاً 💪';
            } else if (percentage >= 40) {
                level = 'جمال متوسط 🌸';
                emoji = '🌸';
                comment = 'جمالك جميل، يحتاج فقط إلى بعض الاهتمام 🥰';
                advice = 'العناية بنفسك تضاعف جمالك، ابدأ اليوم 💄';
            } else if (percentage >= 20) {
                level = 'بحاجة إلى تحسين 🌱';
                emoji = '🌱';
                comment = 'لا تقلق، الجمال الحقيقي يأتي من الداخل ❤️';
                advice = 'ركز على شخصيتك، فهي أجمل ما فيك 💫';
            } else {
                level = 'روح جميلة 💛';
                emoji = '💛';
                comment = 'الجمال الحقيقي في القلب والروح، وليس المظهر 🫶';
                advice = 'أنت جميل/جميلة بطريقتك الخاصة، لا تقارن نفسك بأحد 🌟';
            }

            const lines = [
                '',
                `👤 المستهدف: @${targetId}`,
                `📊 النسبة: ${percentage}% ${emoji}`,
                `🏅 المستوى: ${level}`,
                `🗣️ ${comment}`,
                `💡 نصيحة: ${advice}`,
                '',
                `📌 تقييم ${percentage >= 50 ? 'إيجابي ✅' : 'تحتاج إلى تطوير 💪'}`
            ];

            let msgText = `💅 نـسـبـة الـجـمـال 💅\n`;
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
            console.error('✗ خطأ في أمر جمال:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ حدث خطأ أثناء تنفيذ الأمر.'
            }, { quoted: msg });
        }
    }
};