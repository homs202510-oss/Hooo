// خروف.js - تحليل نسبة الخروف (نسخة فاخرة بدون خطوط)
const fs = require('fs');
const path = require('path');

const khrofPath = path.join(__dirname, 'db-khrof.json');

if (!fs.existsSync(path.dirname(khrofPath))) fs.mkdirSync(path.dirname(khrofPath), { recursive: true });
if (!fs.existsSync(khrofPath)) fs.writeFileSync(khrofPath, JSON.stringify({}, null, 2));

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; }
}
function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ========== عوامل تحليل الخروف ==========
function calculateKhrof(userId) {
    const khrofData = loadJSON(khrofPath);
    const userData = khrofData[userId] || { interactions: 0, lastCheck: Date.now() };
    
    let khrof = 50;
    
    const interactions = userData.interactions || 0;
    khrof += Math.min(interactions * 2, 20);
    
    const daysSinceLastCheck = (Date.now() - (userData.lastCheck || Date.now())) / (1000 * 60 * 60 * 24);
    khrof -= Math.min(daysSinceLastCheck * 2, 20);
    
    const randomFactor = Math.floor(Math.random() * 11) - 5;
    khrof += randomFactor;
    
    if (interactions > 50) khrof += 5;
    if (interactions > 100) khrof += 5;
    if (interactions < 5) khrof -= 10;
    if (daysSinceLastCheck > 30) khrof -= 10;
    
    khrof = Math.min(100, Math.max(0, Math.round(khrof)));
    
    userData.lastCheck = Date.now();
    userData.interactions = (userData.interactions || 0) + 1;
    khrofData[userId] = userData;
    saveJSON(khrofPath, khrofData);
    
    return khrof;
}

// ========== دالة تعيين نسبة خروف مخصصة ==========
function setKhrof(userId, percentage) {
    const khrofData = loadJSON(khrofPath);
    if (!khrofData[userId]) {
        khrofData[userId] = { interactions: 0, lastCheck: Date.now() };
    }
    khrofData[userId].customKhrof = Math.min(100, Math.max(0, percentage));
    saveJSON(khrofPath, khrofData);
    return khrofData[userId].customKhrof;
}

// ========== دالة الحصول على نسبة خروف ==========
function getKhrof(userId) {
    const khrofData = loadJSON(khrofPath);
    if (khrofData[userId]?.customKhrof !== undefined) {
        return khrofData[userId].customKhrof;
    }
    return null;
}

// ========== البيانات الموسعة ==========
const results = [
    { min: 1, max: 5, text: 'أنقى من ماء زمزم، ما في شي اسمه خروف عندك 🤍', emoji: '👼' },
    { min: 6, max: 15, text: 'خروف خفيف، بس لسا تعتبر نفسك إنسان 🤏', emoji: '😅' },
    { min: 16, max: 30, text: 'تبدأ تظهر عليك علامات الخروف، احترس 🧐', emoji: '🤨' },
    { min: 31, max: 45, text: 'نصف خروف، نصفي الآخر إنسان، وضعك غريب 😅', emoji: '🤔' },
    { min: 46, max: 60, text: 'خروف بشكل واضح، بس لسا في أمل ترجع 🫣', emoji: '😬' },
    { min: 61, max: 75, text: 'خروف رسمي، مرحباً بك في قطيع الخراف 🐑', emoji: '🐑' },
    { min: 76, max: 90, text: 'خروف محترف، تأخذ دورة تدريبية في الخروف 💪', emoji: '💪' },
    { min: 91, max: 99, text: 'أسطورة الخروف! الكل يحترمك 🏆', emoji: '🏆' },
    { min: 100, max: 100, text: 'ملك الخراف! يستاهل تتويج 👑', emoji: '👑' }
];

// ========== نكات الخروف ==========
const khrofJokes = [
    '🐑 سألوا الخروف: ليه بتخرف؟ قال: دي طبيعتي',
    '🐑 الخروف بيحب العشب عشان ياكل ويرتاح',
    '🐑 الخروف الوحيد اللي بيفكر ياكل ولا ينام',
    '🐑 سألوا الخروف: ليه صوتك مeee؟ قال: عشان الكل يسمعني',
    '🐑 الخروف بيقول: أنا مش غبي، أنا بس مركز في الأكل'
];

// ========== أصوات الخروف ==========
const khrofSounds = [
    '🐑 *مااااءءء* 🐑',
    '🐑 *ماااء ماااء* 🐑',
    '🐑 *ماااء موااءءء* 🐑',
    '🐑 *باه باه* 🐑',
    '🐑 *خروف خروف* 🐑'
];

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    // التأكد من أن lines مصفوفة
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🐑 نـسـبـة الـخـروف 🐑\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: ['خروف','خرفنة'],
    category: 'تسلية',
    description: '🐑 يحسب نسبة الخروف عند عضو مع تعليق مضحك',
    group: true,
    usage: '.خروف @مستخدم | .خروف (رد على رسالة)',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/);

            let target;
            let isCustom = false;
            let customPercentage = null;

            // التحقق من وجود نسبة مخصصة
            if (args.length >= 3 && args[1] === 'تعيين') {
                const percentage = parseInt(args[2]);
                if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
                    isCustom = true;
                    customPercentage = percentage;

                    if (contextInfo?.mentionedJid && contextInfo.mentionedJid.length > 0) {
                        target = contextInfo.mentionedJid[0];
                    } else if (contextInfo?.participant) {
                        target = contextInfo.participant;
                    } else {
                        target = msg.key.participant || msg.key.remoteJid;
                    }

                    if (!target.includes('@')) {
                        target = `${target}@s.whatsapp.net`;
                    }

                    const userId = target.split('@')[0];
                    setKhrof(userId, customPercentage);

                    const lines = [
                        `⚙️ تـعـيـيـن نـسـبـة الـخـروف ⚙️`,
                        ``,
                        `👤 المستهدف: @${userId}`,
                        `📊 تم تعيين نسبة الخروف: ${customPercentage}%`,
                        `${customPercentage >= 70 ? '🐑 خروف أصيل' : customPercentage >= 40 ? '🐑 خروف متوسط' : '🧠 إنسان عاقل'}`,
                        `✅ تم التحديث بنجاح!`
                    ];

                    await sendMessage(sock, chatId, lines, msg, [target]);
                    return;
                }
            }

            // تحديد الهدف
            if (contextInfo?.mentionedJid && contextInfo.mentionedJid.length > 0) {
                target = contextInfo.mentionedJid[0];
            } else if (contextInfo?.participant) {
                target = contextInfo.participant;
            } else {
                target = msg.key.participant || msg.key.remoteJid;
            }

            if (!target.includes('@')) {
                target = `${target}@s.whatsapp.net`;
            }

            const userId = target.split('@')[0];
            
            // حساب نسبة الخروف
            let khrofPercent;
            const customKhrof = getKhrof(userId);
            
            if (customKhrof !== null) {
                khrofPercent = customKhrof;
            } else {
                khrofPercent = calculateKhrof(userId);
            }

            // اختيار النتيجة المناسبة
            let selected = results.find(r => khrofPercent >= r.min && khrofPercent <= r.max);
            if (!selected) selected = results[results.length - 1];

            // نكتة وصوت عشوائي
            const joke = khrofJokes[Math.floor(Math.random() * khrofJokes.length)];
            const sound = khrofSounds[Math.floor(Math.random() * khrofSounds.length)];

            // تحليل المستوى
            let level = '';
            let advice = '';
            
            if (khrofPercent >= 90) {
                level = '👑 ملك الخراف';
                advice = 'أنت ملك الخراف، لا تغير شيء! استمر في الخروف 🐑';
            } else if (khrofPercent >= 70) {
                level = '🏆 أسطورة الخروف';
                advice = 'استمر في التألق، أنت قدوة للخراف! 🐑';
            } else if (khrofPercent >= 50) {
                level = '🐑 خروف محترف';
                advice = 'خذ دورة تدريبية في الخروف لتتطور أكثر';
            } else if (khrofPercent >= 30) {
                level = '🤔 نصف خروف';
                advice = 'قرر مصيرك، خروف ولا إنسان؟';
            } else if (khrofPercent >= 10) {
                level = '🤏 خروف خفيف';
                advice = 'لسا في أمل ترجع إنسان، لا تستسلم للخروف';
            } else {
                level = '👼 إنسان نقي';
                advice = 'نصيحة: تعلم الخروف من المحترفين 🐑';
            }

            // ========== إرسال النتيجة ==========
            const lines = [
                `👤 المستهدف: @${userId}`,
                `📈 نسبة الخروف: ${khrofPercent}% ${selected.emoji}`,
                `🔊 ${sound}`,
                `🏅 المستوى: ${level}`,
                `🗣️ ${selected.text}`,
                ``,
                `😂 نكتة الخروف:`,
                `${joke}`,
                ``,
                `💡 نصيحة: ${advice}`
            ];

            await sendMessage(sock, chatId, lines, msg, [target]);

        } catch (error) {
            console.error('✗ خطأ في أمر خروف:', error);
            const lines = [
                `❌ حدث خطأ أثناء تنفيذ الأمر.`,
                `📌 حاول مرة أخرى لاحقاً.`
            ];
            await sendMessage(sock, msg.key.remoteJid, lines, msg);
        }
    }
};