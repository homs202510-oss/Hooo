// هدايا.js - نظام الهدايا اليومية والأسبوعية والشهرية والسنوية والقرنية

const fs = require('fs');
const path = require('path');

// ========== المسارات ==========
const pointsFile = path.join(__dirname, 'db-points.json');
const profilesFile = path.join(__dirname, 'db-profiles.json');
const rewardsFile = path.join(__dirname, 'db-rewards.json');
const imagesFolder = __dirname;

// ========== التأكد من وجود الملفات ==========
if (!fs.existsSync(pointsFile)) fs.writeFileSync(pointsFile, '{}');
if (!fs.existsSync(profilesFile)) fs.writeFileSync(profilesFile, '{}');
if (!fs.existsSync(rewardsFile)) fs.writeFileSync(rewardsFile, '{}');
if (!fs.existsSync(imagesFolder)) fs.mkdirSync(imagesFolder, { recursive: true });

// ========== دوال التحميل والحفظ ==========
function loadPoints() {
    try { return JSON.parse(fs.readFileSync(pointsFile)); } catch { return {}; }
}

function savePoints(data) {
    fs.writeFileSync(pointsFile, JSON.stringify(data, null, 2));
}

function loadRewards() {
    try { return JSON.parse(fs.readFileSync(rewardsFile)); } catch { return {}; }
}

function saveRewards(data) {
    fs.writeFileSync(rewardsFile, JSON.stringify(data, null, 2));
}

function loadProfiles() {
    try { return JSON.parse(fs.readFileSync(profilesFile)); } catch { return {}; }
}

function getProfile(jid) {
    const profiles = loadProfiles();
    return profiles[jid] || null;
}

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎁 *نـظـام الـهـدايـا* 🎁\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== دوال جلب الصورة ==========
async function getProfilePicture(sock, jid) {
    try {
        const ppUrl = await sock.profilePictureUrl(jid, 'image');
        if (ppUrl) {
            const response = await fetch(ppUrl);
            const buffer = await response.arrayBuffer();
            return Buffer.from(buffer);
        }
    } catch (e) {}
    return null;
}

// ========== دوال المستويات (50 مستوى) ==========
const levelSystem = [
    { level: 1, minXp: 0, title: 'الوافد الجديد' },
    { level: 2, minXp: 50, title: 'البادئ النشط' },
    { level: 3, minXp: 100, title: 'المتفاعل الصغير' },
    { level: 4, minXp: 180, title: 'النجم الصاعد' },
    { level: 5, minXp: 280, title: 'المستكشف' },
    { level: 6, minXp: 400, title: 'الحارس المتقدم' },
    { level: 7, minXp: 550, title: 'البطل المثقف' },
    { level: 8, minXp: 730, title: 'القائد الحكيم' },
    { level: 9, minXp: 940, title: 'حارس الطريق' },
    { level: 10, minXp: 1180, title: 'المرشد النبيل' },
    { level: 11, minXp: 1450, title: 'السيف الذهبي' },
    { level: 12, minXp: 1750, title: 'الفارس الأسطوري' },
    { level: 13, minXp: 2080, title: 'الحكيم المتألق' },
    { level: 14, minXp: 2440, title: 'الظل الصامت' },
    { level: 15, minXp: 2830, title: 'النسر المحلق' },
    { level: 16, minXp: 3250, title: 'القلعة الحصينة' },
    { level: 17, minXp: 3700, title: 'الروح الثائرة' },
    { level: 18, minXp: 4180, title: 'التاج المضيء' },
    { level: 19, minXp: 4690, title: 'الأسطورة الحية' },
    { level: 20, minXp: 5230, title: 'الملك المتوج' },
    { level: 21, minXp: 5800, title: 'الإمبراطور' },
    { level: 22, minXp: 6400, title: 'الجبل الشامخ' },
    { level: 23, minXp: 7030, title: 'النجم القطبي' },
    { level: 24, minXp: 7690, title: 'الضوء الأزلي' },
    { level: 25, minXp: 8380, title: 'الكوني' },
    { level: 26, minXp: 9100, title: 'الحارس الأبدي' },
    { level: 27, minXp: 9850, title: 'السيد المطلق' },
    { level: 28, minXp: 10630, title: 'الظل الأزلي' },
    { level: 29, minXp: 11440, title: 'الروح الخالدة' },
    { level: 30, minXp: 12280, title: 'التاج الإلهي' },
    { level: 31, minXp: 13150, title: 'النجم الساطع' },
    { level: 32, minXp: 14050, title: 'القلعة العملاقة' },
    { level: 33, minXp: 14980, title: 'السيف المقدس' },
    { level: 34, minXp: 15940, title: 'الحكيم العظيم' },
    { level: 35, minXp: 16930, title: 'النسر العملاق' },
    { level: 36, minXp: 17950, title: 'الفارس الذهبي' },
    { level: 37, minXp: 19000, title: 'الملك العادل' },
    { level: 38, minXp: 20080, title: 'الإمبراطور العظيم' },
    { level: 39, minXp: 21190, title: 'الجبل الأبدي' },
    { level: 40, minXp: 22330, title: 'النجم المتألق' },
    { level: 41, minXp: 23500, title: 'الضوء الخالد' },
    { level: 42, minXp: 24700, title: 'الكوني المتقدم' },
    { level: 43, minXp: 25930, title: 'الحارس الأسطوري' },
    { level: 44, minXp: 27190, title: 'السيد الأعلى' },
    { level: 45, minXp: 28480, title: 'الظل الخالد' },
    { level: 46, minXp: 29800, title: 'الروح الإلهية' },
    { level: 47, minXp: 31150, title: 'التاج الخالد' },
    { level: 48, minXp: 32530, title: 'النجم الأزلي' },
    { level: 49, minXp: 33940, title: 'القلعة الأبدية' },
    { level: 50, minXp: 35380, title: 'الأسطورة الخالدة' },
];

function getUserLevel(points) {
    let userLevel = 1;
    let userTitle = levelSystem[0].title;
    for (const level of levelSystem) {
        if (points >= level.minXp) {
            userLevel = level.level;
            userTitle = level.title;
        }
    }
    return { level: userLevel, title: userTitle };
}

// ========== دوال النقاط ==========
function getPoints(jid) {
    const points = loadPoints();
    return points[jid] || 0;
}

function addPoints(jid, amount) {
    const points = loadPoints();
    points[jid] = (points[jid] || 0) + amount;
    savePoints(points);
    return points[jid];
}

// ========== دوال التحقق من الهدايا ==========
function checkReward(jid, type) {
    const rewards = loadRewards();
    if (!rewards[jid]) rewards[jid] = {};
    return rewards[jid][type] || 0;
}

function setReward(jid, type) {
    const rewards = loadRewards();
    if (!rewards[jid]) rewards[jid] = {};
    rewards[jid][type] = Date.now();
    saveRewards(rewards);
}

function getTimeRemaining(lastTime, cooldownMs) {
    const now = Date.now();
    const elapsed = now - lastTime;
    const remaining = cooldownMs - elapsed;
    if (remaining <= 0) return 0;
    return remaining;
}

function formatTime(ms) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    ms -= days * 24 * 60 * 60 * 1000;
    const hours = Math.floor(ms / (60 * 60 * 1000));
    ms -= hours * 60 * 60 * 1000;
    const minutes = Math.floor(ms / (60 * 1000));
    ms -= minutes * 60 * 1000;
    const seconds = Math.floor(ms / 1000);
    
    let result = [];
    if (days > 0) result.push(`${days} يوم`);
    if (hours > 0) result.push(`${hours} ساعة`);
    if (minutes > 0) result.push(`${minutes} دقيقة`);
    if (seconds > 0 && result.length === 0) result.push(`${seconds} ثانية`);
    
    return result.join(' ');
}

// ========== دالة الهدية الرئيسية ==========
async function handleReward(sock, msg, chatId, sender, type, cooldownMs, minPoints, maxPoints, requiredLevel = null, rewardName) {
    const senderPoints = getPoints(sender);
    const userInfo = getUserLevel(senderPoints);
    const userLevel = userInfo.level;
    const userTitle = userInfo.title;

    // التحقق من المستوى المطلوب
    if (requiredLevel !== null && userLevel < requiredLevel) {
        await sendMessage(sock, chatId, [
            `⛔ *هذه الهدية تحتاج مستوى ${requiredLevel} فأعلى.*`,
            '',
            `📌 مستواك الحالي: ${userLevel}`,
            `📊 نقاطك: ${senderPoints}`
        ], msg);
        return;
    }

    const lastTime = checkReward(sender, type);
    const remaining = getTimeRemaining(lastTime, cooldownMs);

    if (remaining > 0) {
        await sendMessage(sock, chatId, [
            `⏳ *هديتك ${rewardName} مستحقة بعد:*`,
            '',
            `📌 ${formatTime(remaining)}`,
            '',
            '🕐 عد بعد انتهاء الوقت.'
        ], msg);
        return;
    }

    // حساب المكافأة
    const pointsGift = Math.floor(Math.random() * (maxPoints - minPoints + 1)) + minPoints;
    const newPoints = addPoints(sender, pointsGift);
    setReward(sender, type);

    const profile = getProfile(sender);
    const nickname = profile?.nickname || sender.split('@')[0];
    const gender = profile?.gender || 'غير محدد';
    const age = profile?.age || 'غير محدد';

    // جلب صورة حساب الشخص
    const imageBuffer = await getProfilePicture(sock, sender);

    const cooldownText = {
        daily: '24 ساعة',
        weekly: '7 أيام',
        monthly: '30 يوم',
        annual: '365 يوم',
        century: '100 سنة'
    };

    const lines = [
        `🎊 *هديتك ${rewardName}!*`,
        '',
        `👤 @${sender.split('@')[0]}`,
        `🏷️ اللقب: ${nickname}`,
        `📅 العمر: ${age}`,
        `⚥ الجنس: ${gender}`,
        `📊 مستواك: ${userLevel}`,
        `🏆 لقب المستوى: ${userTitle}`,
        '',
        `🎉 +${pointsGift} نقطة`,
        `💰 الرصيد الجديد: ${newPoints} نقطة`,
        '',
        `📌 عد بعد ${cooldownText[type]} للحصول على هدية جديدة.`
    ];

    const mentions = [sender];

    // إرسال مع صورة إذا وجدت
    if (imageBuffer) {
        let caption = `🎁 *نـظـام الـهـدايـا* 🎁\n`;
        caption += `━━━━━━━━━━━━━━━━━━━━\n`;
        for (const line of lines) {
            if (line && line.trim()) {
                caption += `${line}\n`;
            }
        }
        caption += `━━━━━━━━━━━━━━━━━━━━\n`;
        caption += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: caption,
            mentions: mentions
        }, { quoted: msg });
    } else {
        await sendMessage(sock, chatId, lines, msg, mentions);
    }
}

// ========== أوامر الهدايا ==========
module.exports = {
    command: ['يومي', 'هدية', 'هديه', 'اسبوعي', 'شهري', 'سنوي', 'قرني'],
    category: 'عام',
    description: '🎁 نظام الهدايا اليومية والأسبوعية والشهرية والسنوية والقرنية',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            
            // استخراج الأمر فقط مع تجاهل أي كلمات إضافية
            const parts = body.split(/\s+/);
            const command = parts[0]?.replace('.', '').toLowerCase();
            
            // إذا لم يكن هناك أمر، نخرج
            if (!command) return;

            const rewardTypes = {
                'يومي': { type: 'daily', cooldown: 24 * 60 * 60 * 1000, min: 50, max: 500, level: null, name: 'اليومية ☀️' },
                'هدية': { type: 'daily', cooldown: 24 * 60 * 60 * 1000, min: 50, max: 500, level: null, name: 'اليومية ☀️' },
                'هديه': { type: 'daily', cooldown: 24 * 60 * 60 * 1000, min: 50, max: 500, level: null, name: 'اليومية ☀️' },
                'اسبوعي': { type: 'weekly', cooldown: 7 * 24 * 60 * 60 * 1000, min: 500, max: 1500, level: null, name: 'الأسبوعية 📆' },
                'شهري': { type: 'monthly', cooldown: 30 * 24 * 60 * 60 * 1000, min: 2000, max: 5000, level: 5, name: 'الشهرية 📅' },
                'سنوي': { type: 'annual', cooldown: 365 * 24 * 60 * 60 * 1000, min: 8000, max: 15000, level: 10, name: 'السنوية 🎆' },
                'قرني': { type: 'century', cooldown: 100 * 365 * 24 * 60 * 60 * 1000, min: 50000, max: 100000, level: 15, name: 'القرنية 🌌' }
            };

            const reward = rewardTypes[command];
            if (!reward) return;

            await handleReward(
                sock,
                msg,
                chatId,
                sender,
                reward.type,
                reward.cooldown,
                reward.min,
                reward.max,
                reward.level,
                reward.name
            );

        } catch (error) {
            console.error('❌ خطأ في أمر الهدية:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};