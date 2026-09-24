// شاذ.js - تحليل نسبة الشذوذ (نسخة بدون خطوط)
module.exports = {
    command: ['شاذ'],
    category: 'تسلية',
    description: '📊 يحسب نسبة الشذوذ عند عضو بشكل عشوائي مع تعليق مضحك',
    group: true,
    usage: '.شاذ @مستخدم | .شاذ (رد على رسالة)',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

            // تحديد الهدف
            let target;

            // 1️⃣ منشن
            if (contextInfo?.mentionedJid && contextInfo.mentionedJid.length > 0) {
                target = contextInfo.mentionedJid[0];
            }
            // 2️⃣ رد على رسالة
            else if (contextInfo?.participant) {
                target = contextInfo.participant;
            }
            // 3️⃣ نفسه (المرسل)
            else {
                target = msg.key.participant || msg.key.remoteJid;
            }

            // التأكد من صيغة الـ JID
            if (!target.includes('@')) {
                target = `${target}@s.whatsapp.net`;
            }

            const targetNum = target.split('@')[0];

            // ========== بيانات النتائج ==========
            const results = [
                { min: 1, max: 5, text: 'رجل ختم دورة الصاعقة 7 مرات 🪖🔥، ما في شي اسمه شذوذ عند هالرجل.' },
                { min: 6, max: 15, text: 'عسكري سابق في الحد الجنوبي 🔫، لكن عنده ميول غريبة للكشخة.' },
                { min: 16, max: 30, text: 'بوادر شذوذ خفيفة، لسا تقدر تنقذ حالك 🥋.' },
                { min: 31, max: 45, text: 'نصف شاذ، نصفي الآخر متردد 🤔.' },
                { min: 46, max: 60, text: 'شاذ بشكل واضح، بس لسا في أمل 🌈.' },
                { min: 61, max: 75, text: 'شاذ رسمي، عضو في النادي 🏳️‍🌈.' },
                { min: 76, max: 90, text: 'شاذ محترف، ياخذ دورة تدريبية 🎀.' },
                { min: 91, max: 99, text: 'شاهين المخلوط 💅🏻🎀، ما في أحد زيك.' },
                { min: 100, max: 100, text: 'أسطورة الشذوذ! يستاهل تمثال 🏆.' }
            ];

            // اختيار نتيجة عشوائية
            const randomPercent = Math.floor(Math.random() * 100) + 1;
            let selected = results.find(r => randomPercent >= r.min && randomPercent <= r.max);
            if (!selected) selected = results[results.length - 1];

            // ========== إرسال الرسالة ==========
            const lines = [
                '📊 تـحـلـيـل الـشـذوذ 📊',
                '',
                `👤 المستهدف: @${targetNum}`,
                `📈 نسبة الشذوذ: ${randomPercent}%`,
                `🗣️ ${selected.text}`
            ];

            let msgText = `📊 تـحـلـيـل الـشـذوذ 📊\n`;
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            for (const line of lines) {
                msgText += `${line}\n`;
            }
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            msgText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

            await sock.sendMessage(
                chatId,
                {
                    text: msgText,
                    mentions: [target]
                },
                { quoted: msg }
            );

        } catch (error) {
            console.error('✗ خطأ في أمر الشاذ:', error);
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: '❌ حدث خطأ أثناء تنفيذ الأمر.'
                },
                { quoted: msg }
            );
        }
    }
};