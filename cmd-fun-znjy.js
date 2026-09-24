// زنجي.js - تحليل نسبة الزنوجة (نسخة فاخرة بدون خطوط)
const fs = require('fs');
const path = require('path');

const zanjiPath = path.join(__dirname, 'db-zanji.json');

if (!fs.existsSync(path.dirname(zanjiPath))) fs.mkdirSync(path.dirname(zanjiPath), { recursive: true });
if (!fs.existsSync(zanjiPath)) fs.writeFileSync(zanjiPath, JSON.stringify({}, null, 2));

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; }
}
function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ========== عوامل تحليل الزنوجة ==========
function calculateZanji(userId) {
    const zanjiData = loadJSON(zanjiPath);
    const userData = zanjiData[userId] || { interactions: 0, lastCheck: Date.now() };
    
    let zanji = 50;
    
    const interactions = userData.interactions || 0;
    zanji += Math.min(interactions * 2, 20);
    
    const daysSinceLastCheck = (Date.now() - (userData.lastCheck || Date.now())) / (1000 * 60 * 60 * 24);
    zanji -= Math.min(daysSinceLastCheck * 2, 20);
    
    const randomFactor = Math.floor(Math.random() * 11) - 5;
    zanji += randomFactor;
    
    if (interactions > 50) zanji += 5;
    if (interactions > 100) zanji += 5;
    if (interactions < 5) zanji -= 10;
    if (daysSinceLastCheck > 30) zanji -= 10;
    
    zanji = Math.min(100, Math.max(0, Math.round(zanji)));
    
    userData.lastCheck = Date.now();
    userData.interactions = (userData.interactions || 0) + 1;
    zanjiData[userId] = userData;
    saveJSON(zanjiPath, zanjiData);
    
    return zanji;
}

// ========== دالة تعيين نسبة زنوجة مخصصة ==========
function setZanji(userId, percentage) {
    const zanjiData = loadJSON(zanjiPath);
    if (!zanjiData[userId]) {
        zanjiData[userId] = { interactions: 0, lastCheck: Date.now() };
    }
    zanjiData[userId].customZanji = Math.min(100, Math.max(0, percentage));
    saveJSON(zanjiPath, zanjiData);
    return zanjiData[userId].customZanji;
}

// ========== دالة الحصول على نسبة زنوجة ==========
function getZanji(userId) {
    const zanjiData = loadJSON(zanjiPath);
    if (zanjiData[userId]?.customZanji !== undefined) {
        return zanjiData[userId].customZanji;
    }
    return null;
}

// ========== البيانات الموسعة ==========
const results = [
    { min: 1, max: 5, text: 'أنقى من ماء زمزم، ما في شي اسمه زنوجة عندك 🤍', emoji: '👼' },
    { min: 6, max: 15, text: 'زنوجة خفيفة، بس لسا تعتبر نفسك أبيض 🤏', emoji: '😅' },
    { min: 16, max: 30, text: 'تبدأ تظهر عليك علامات الزنوجة، احترس 🧐', emoji: '🤨' },
    { min: 31, max: 45, text: 'نصف زنجي، نصفي الآخر أبيض، وضعك غريب 😅', emoji: '🤔' },
    { min: 46, max: 60, text: 'زنجي بشكل واضح، بس لسا في أمل ترجع 🫣', emoji: '😬' },
    { min: 61, max: 75, text: 'زنجي رسمي، مرحباً بك في النادي 🖤', emoji: '🖤' },
    { min: 76, max: 90, text: 'زنجي محترف، تأخذ دورة تدريبية في الزنوجة 💪🏿', emoji: '💪' },
    { min: 91, max: 99, text: 'أسطورة الزنوجة! الكل يحترمك 🏆', emoji: '🏆' },
    { min: 100, max: 100, text: 'ملك الزنوجة! يستاهل تتويج 👑', emoji: '👑' }
];

// ========== نكات الزنوجة ==========
const zanjiJokes = [
    '🤣 سألوا الزنجي: ليه عيونك بيضا؟ قال: عشان أشوف النور',
    '😂 الزنجي بيحب الظلام عشان محدش يشوفه',
    '😅 الزنجي الوحيد اللي بيلبس أسود عشان يختفي',
    '🤣 سألوا الزنجي: ليه سنانك بيضا؟ قال: عشان تبين في الظلام',
    '😂 الزنجي بيقول: أنا مش أسود، أنا لوني غامق شوية'
];

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    // التأكد من أن lines مصفوفة
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `📊 تـحـلـيـل الـز نـوجـة 📊\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: ['زنجي'],
    category: 'تسلية',
    description: '📊 يحسب نسبة الزنوجة عند عضو مع تعليق مضحك',
    group: true,
    usage: '.زنجي @مستخدم | .زنجي (رد على رسالة)',

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
                    setZanji(userId, customPercentage);

                    const lines = [
                        `⚙️ تـعـيـيـن نـسـبـة الـز نـوجـة ⚙️`,
                        ``,
                        `👤 المستهدف: @${userId}`,
                        `📊 تم تعيين نسبة الزنوجة: ${customPercentage}%`,
                        `${customPercentage >= 70 ? '🖤 زنجي أصيل' : customPercentage >= 40 ? '🖤 زنجي متوسط' : '🤍 أبيض نقي'}`,
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
            
            // حساب نسبة الزنوجة
            let zanjiPercent;
            const customZanji = getZanji(userId);
            
            if (customZanji !== null) {
                zanjiPercent = customZanji;
            } else {
                zanjiPercent = calculateZanji(userId);
            }

            // اختيار النتيجة المناسبة
            let selected = results.find(r => zanjiPercent >= r.min && zanjiPercent <= r.max);
            if (!selected) selected = results[results.length - 1];

            // نكتة عشوائية
            const joke = zanjiJokes[Math.floor(Math.random() * zanjiJokes.length)];

            // تحليل المستوى
            let level = '';
            let advice = '';
            
            if (zanjiPercent >= 90) {
                level = '👑 ملك الزنوجة';
                advice = 'أنت ملك الزنوجة، لا تغير شيء!';
            } else if (zanjiPercent >= 70) {
                level = '🏆 أسطورة الزنوجة';
                advice = 'استمر في التألق، أنت قدوة للزنجية!';
            } else if (zanjiPercent >= 50) {
                level = '🖤 زنجي محترف';
                advice = 'خذ دورة تدريبية في الزنوجة لتتطور أكثر';
            } else if (zanjiPercent >= 30) {
                level = '🤔 نصف زنجي';
                advice = 'قرر مصيرك، زنوجة ولا بياض؟';
            } else if (zanjiPercent >= 10) {
                level = '🤏 زنوجة خفيفة';
                advice = 'لسا في أمل ترجع، لا تستسلم للبياض';
            } else {
                level = '👼 أبيض نقي';
                advice = 'نصيحة: تعلم الزنوجة من المحترفين';
            }

            // ========== إرسال النتيجة ==========
            const lines = [
                `👤 المستهدف: @${userId}`,
                `📈 نسبة الزنوجة: ${zanjiPercent}% ${selected.emoji}`,
                `🏅 المستوى: ${level}`,
                `🗣️ ${selected.text}`,
                ``,
                `😂 الزنوجة:`,
                `${joke}`,
                ``,
                `💡 نصيحة: ${advice}`
            ];

            await sendMessage(sock, chatId, lines, msg, [target]);

        } catch (error) {
            console.error('✗ خطأ في أمر الزنجي:', error);
            const lines = [
                `❌ حدث خطأ أثناء تنفيذ الأمر.`,
                `📌 حاول مرة أخرى لاحقاً.`
            ];
            await sendMessage(sock, msg.key.remoteJid, lines, msg);
        }
    }
};