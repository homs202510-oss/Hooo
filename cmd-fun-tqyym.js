// تقييم.js - تقييم شخص بصفة عشوائية (نسخة محسنة بدون خطوط)
module.exports = {
    command: ['تقييم'],
    category: 'تسلية',
    description: '🎯 يقيم شخص تمنشنه أو ترد على رسالته بتقييم عشوائي لصفة عشوائية',
    usage: '.تقييم @منشن | .تقييم (رد على رسالة)',

    async execute(sock, m) {
        try {
            const chatId = m.key.remoteJid;

            if (!chatId.endsWith('@g.us')) {
                await sock.sendMessage(chatId, {
                    text: '🚫 هذا الأمر يعمل فقط في المجموعات!'
                }, { quoted: m });
                return;
            }

            // جلب المنشن أو الرد على رسالة
            const mentionedJids = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const quotedSender = m.message?.extendedTextMessage?.contextInfo?.participant;

            let target;
            if (mentionedJids.length > 0) {
                target = mentionedJids[0];
            } else if (quotedSender) {
                target = quotedSender;
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ استخدم الأمر مع منشن أو رد على رسالة شخص!\n📝 مثال: .تقييم @الاسم أو رد على رسالة الشخص.'
                }, { quoted: m });
                return;
            }

            // التأكد من صيغة الـ JID
            if (!target.includes('@')) {
                target = `${target}@s.whatsapp.net`;
            }

            const targetName = `@${target.split('@')[0]}`;

            // ========== قائمة الصفات ==========
            const types = [
                "الجمال 💅",
                "الذكاء 🧠",
                "الشر 😈",
                "البراءة 😇",
                "الهيبة 😎",
                "الجنون 🤪",
                "الدراما 🎭",
                "الطيبة ❤️",
                "الكسل 😴",
                "حب الناس 😍",
                "الشطارة 📚",
                "الفهاوة 😵",
                "الرزانة 🧘",
                "العظمة 👑",
                "الرومانسية 💘",
                "العناد 😤",
                "الحكمة 🦉",
                "الجاذبية ✨",
                "الغرور 🦚",
                "المرح 🎉",
                "الشجاعة 🦁",
                "الهدوء 🌊",
                "النشاط ⚡",
                "السخرية 😏",
                "الحظ 🍀",
                "الثقة 💪",
                "الإبداع 🎨",
                "اللطف 🌸",
                "الفكاهة 😂",
                "الغموض 🕵️"
            ];

            const randomType = types[Math.floor(Math.random() * types.length)];
            const randomPercentage = Math.floor(Math.random() * 101);

            // ========== تحليل النتيجة ==========
            let level = '';
            let emoji = '';
            let comment = '';

            if (randomPercentage >= 90) {
                level = 'ممتاز 🔥';
                emoji = '👑';
                comment = 'أنت أسطورة في هذا المجال! لا أحد يضاهيك ✨';
            } else if (randomPercentage >= 70) {
                level = 'جيد جداً ⭐';
                emoji = '🌟';
                comment = 'مستوى عالي جداً، استمر على هذا المنوال 💪';
            } else if (randomPercentage >= 50) {
                level = 'متوسط 😐';
                emoji = '📊';
                comment = 'محتاج شوية تطوير، لكنك في الطريق الصحيح 🌱';
            } else if (randomPercentage >= 30) {
                level = 'ضعيف 🫣';
                emoji = '😅';
                comment = 'لا تقلق، الممارسة تجعل الإنسان أفضل 🏃';
            } else {
                level = 'محتاج إنعاش 🚑';
                emoji = '💀';
                comment = 'يا سلام! تحتاج إلى تحسين كبير في هذا المجال 😂';
            }

            const lines = [
                '🎯 *تقييم الشخصية*',
                '',
                `👤 ${targetName}`,
                `📊 الصفة: ${randomType}`,
                `📈 النتيجة: ${randomPercentage}% ${emoji}`,
                `🏅 المستوى: ${level}`,
                `🗣️ ${comment}`,
                '',
                '📌 تقييم عشوائي لكن ممكن يطلع صح!'
            ];

            let msgText = `🎯 تـقـيـيـم شـخـصـيـة 🎯\n`;
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            for (const line of lines) {
                msgText += `${line}\n`;
            }
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            msgText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

            await sock.sendMessage(chatId, {
                text: msgText,
                mentions: [target]
            }, { quoted: m });

        } catch (error) {
            console.error('❌ خطأ في أمر تقييم:', error);
            await sock.sendMessage(m.key.remoteJid, {
                text: '❌ حدث خطأ أثناء تنفيذ الأمر.'
            }, { quoted: m });
        }
    }
};