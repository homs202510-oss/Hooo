// كنز.js - البحث عن كنز يومي (جوائز عشوائية متنوعة)
const fs = require('fs');
const path = require('path');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const pointsPath = path.join(__dirname, 'db-points.json');
const TREASURE_PATH = path.join(__dirname, 'db-treasure.json');

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const RESOURCES_PATH = path.join(dataDir, 'kd-resources.json');
const SOLDIERS_PATH = path.join(dataDir, 'kd-soldiers.json');
const WEAPONS_PATH = path.join(dataDir, 'kd-weapons.json');
const ACCESSORIES_PATH = path.join(dataDir, 'kd-accessories.json');
const POTIONS_PATH = path.join(dataDir, 'kd-potions.json');
const SPELLS_PATH = path.join(dataDir, 'kd-spells.json');
const SOULBOOK_PATH = path.join(dataDir, 'kd-soulbook.json');
const COMPANION_PATH = path.join(dataDir, 'kd-companion.json');
const STATS_PATH = path.join(dataDir, 'kd-stats.json');
const ACTIVE_PATH = path.join(dataDir, 'kd-active.json');

// ===== التأكد من وجود الملفات =====
const allPaths = [MAIN_PATH, RESOURCES_PATH, SOLDIERS_PATH, WEAPONS_PATH, ACCESSORIES_PATH, POTIONS_PATH, SPELLS_PATH, SOULBOOK_PATH, COMPANION_PATH, STATS_PATH, ACTIVE_PATH];
for (const p of allPaths) {
    if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(TREASURE_PATH)) fs.writeFileSync(TREASURE_PATH, JSON.stringify({}, null, 2));

function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
function saveJSON(file, data) {
    try {
        if (fs.existsSync(file)) fs.writeFileSync(file + '.bak', fs.readFileSync(file));
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('❌ فشل حفظ:', file, e.message);
        return false;
    }
}

// ========== دوال التخزين المنفصل ==========
function loadUserData(jid) {
    const main = loadJSON(MAIN_PATH)[jid] || {};
    const resources = loadJSON(RESOURCES_PATH)[jid] || {};
    const soldiers = loadJSON(SOLDIERS_PATH)[jid] || {};
    const weapons = loadJSON(WEAPONS_PATH)[jid] || {};
    const accessories = loadJSON(ACCESSORIES_PATH)[jid] || {};
    const potions = loadJSON(POTIONS_PATH)[jid] || {};
    const spells = loadJSON(SPELLS_PATH)[jid] || {};
    const soulBook = loadJSON(SOULBOOK_PATH)[jid] || {};
    const companion = loadJSON(COMPANION_PATH)[jid] || null;
    const stats = loadJSON(STATS_PATH)[jid] || {};
    const active = loadJSON(ACTIVE_PATH)[jid] || {};

    return {
        level: main.level || 1,
        prosperity: main.prosperity || 0,
        lands: main.lands || 0,
        gold: main.gold || 0,
        name: main.name || `مملكة @${jid.split('@')[0]}`,
        owner: main.owner || jid,
        nameChangesUsed: main.nameChangesUsed || 0,
        resources: resources,
        soldiers: soldiers,
        weapons: weapons,
        accessories: accessories,
        potions: potions,
        spellsUsed: spells,
        soulBook: soulBook,
        companion: companion,
        pvpWins: stats.pvpWins || 0,
        pvpLosses: stats.pvpLosses || 0,
        monstersDefeated: stats.monstersDefeated || 0,
        lastActive: active.lastActive || Date.now()
    };
}

function saveUserData(jid, data) {
    const main = loadJSON(MAIN_PATH);
    main[jid] = {
        level: data.level || 1,
        prosperity: data.prosperity || 0,
        lands: data.lands || 0,
        gold: data.gold || 0,
        name: data.name || `مملكة @${jid.split('@')[0]}`,
        owner: data.owner || jid,
        nameChangesUsed: data.nameChangesUsed || 0
    };
    saveJSON(MAIN_PATH, main);

    const resources = loadJSON(RESOURCES_PATH);
    resources[jid] = data.resources || {};
    saveJSON(RESOURCES_PATH, resources);

    const soldiers = loadJSON(SOLDIERS_PATH);
    soldiers[jid] = data.soldiers || {};
    saveJSON(SOLDIERS_PATH, soldiers);

    const weapons = loadJSON(WEAPONS_PATH);
    weapons[jid] = data.weapons || {};
    saveJSON(WEAPONS_PATH, weapons);

    const accessories = loadJSON(ACCESSORIES_PATH);
    accessories[jid] = data.accessories || {};
    saveJSON(ACCESSORIES_PATH, accessories);

    const potions = loadJSON(POTIONS_PATH);
    potions[jid] = data.potions || {};
    saveJSON(POTIONS_PATH, potions);

    const spells = loadJSON(SPELLS_PATH);
    spells[jid] = data.spellsUsed || {};
    saveJSON(SPELLS_PATH, spells);

    const soulBook = loadJSON(SOULBOOK_PATH);
    soulBook[jid] = data.soulBook || { pages: 0, spirits: [] };
    saveJSON(SOULBOOK_PATH, soulBook);

    const companion = loadJSON(COMPANION_PATH);
    companion[jid] = data.companion || null;
    saveJSON(COMPANION_PATH, companion);

    const stats = loadJSON(STATS_PATH);
    stats[jid] = {
        pvpWins: data.pvpWins || 0,
        pvpLosses: data.pvpLosses || 0,
        monstersDefeated: data.monstersDefeated || 0
    };
    saveJSON(STATS_PATH, stats);

    const active = loadJSON(ACTIVE_PATH);
    active[jid] = {
        lastActive: data.lastActive || Date.now()
    };
    saveJSON(ACTIVE_PATH, active);
}

function userExists(jid) {
    const main = loadJSON(MAIN_PATH);
    return !!main[jid];
}

// ========== دوال الكنز ==========
function loadTreasure() { return loadJSON(TREASURE_PATH); }
function saveTreasure(data) { saveJSON(TREASURE_PATH, data); }

// ========== قائمة الجوائز المتنوعة ==========
const commonRewards = [
    // موارد
    { type: 'wood', amount: 20, weight: 15 },
    { type: 'stone', amount: 15, weight: 12 },
    { type: 'iron', amount: 8, weight: 10 },
    // نقاط
    { type: 'points', amount: 50, weight: 20 },
    { type: 'points', amount: 100, weight: 10 },
    // جنود
    { type: 'soldier', key: 'normal', name: 'جندي عادي', count: 5, weight: 8 },
    { type: 'soldier', key: 'archer', name: 'رامٍ', count: 3, weight: 6 },
    // جرعات
    { type: 'potion', key: 'smallHeal', name: 'جرعة شفاء صغيرة', count: 3, weight: 8 },
    // إكسسوارات بسيطة
    { type: 'accessory', key: 'powerRing', name: 'خاتم القوة', count: 1, weight: 4 },
    { type: 'accessory', key: 'protectionRing', name: 'خاتم الحماية', count: 1, weight: 4 },
];

const rareRewards = [
    { type: 'points', amount: 300, weight: 20 },
    { type: 'points', amount: 500, weight: 10 },
    { type: 'weapon', key: 'ironSword', name: '🗡️ سيف حديدي', count: 1, weight: 12 },
    { type: 'weapon', key: 'goldenShield', name: '🛡️ درع ذهبي', count: 1, weight: 10 },
    { type: 'weapon', key: 'legendaryBow', name: '🏹 قوس أسطوري', count: 1, weight: 8 },
    { type: 'soldier', key: 'knight', name: 'فارس', count: 3, weight: 10 },
    { type: 'soldier', key: 'eliteGuard', name: 'حارس النخبة', count: 2, weight: 8 },
    { type: 'accessory', key: 'shadowMask', name: '🎭 قناع الظل', count: 1, weight: 6 },
    { type: 'soulPage', amount: 3, weight: 8 },
    { type: 'potion', key: 'largeHeal', name: '🧪 جرعة شفاء كبيرة', count: 2, weight: 8 },
    { type: 'spell', key: 'dragonFlame', name: '🔥 لهيب التنين', count: 1, weight: 5 },
    { type: 'spell', key: 'kingsHeal', name: '💖 شفاء الملك', count: 1, weight: 5 },
];

const legendaryRewards = [
    { type: 'points', amount: 1500, weight: 15 },
    { type: 'points', amount: 3000, weight: 5 },
    { type: 'weapon', key: 'fireShield', name: '🔥 درع النار', count: 1, weight: 12 },
    { type: 'weapon', key: 'godShield', name: '✨ درع الملك', count: 1, weight: 10 },
    { type: 'weapon', key: 'eternalBlade', name: '⚔️ نصل الأبدية', count: 1, weight: 8 },
    { type: 'weapon', key: 'deathBow', name: '🏹 قوس الموت', count: 1, weight: 8 },
    { type: 'weapon', key: 'destructionAxe', name: '🪓 فأس الدمار', count: 1, weight: 6 },
    { type: 'soldier', key: 'dragonSpearman', name: '🐉 منشق التنين', count: 3, weight: 10 },
    { type: 'soldier', key: 'legendaryCommander', name: '⚔️ قائد أسطوري', count: 2, weight: 8 },
    { type: 'companion', key: 'dragon', name: '🐦 تنين أسطوري', power: 15, weight: 8 },
    { type: 'companion', key: 'otherworldDragon', name: '🐦 تنين العالم الآخر', power: 25, weight: 5 },
    { type: 'accessory', key: 'kingsCrown', name: '👑 تاج الملوك', count: 1, weight: 6 },
    { type: 'accessory', key: 'heroMask', name: '🎭 قناع البطل', count: 1, weight: 6 },
    { type: 'soulPage', amount: 7, weight: 8 },
    { type: 'spell', key: 'curse', name: '☠️ لعنة الموت', count: 1, weight: 5 },
];

// دالة اختيار عشوائي بالوزن
function weightedRandom(arr) {
    const totalWeight = arr.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    for (const item of arr) {
        random -= item.weight;
        if (random <= 0) return item;
    }
    return arr[0];
}

// ========== دالة توليد الجائزة ==========
function generateReward() {
    const roll = Math.random() * 100;

    // 5% فرصة لجائزة أسطورية
    if (roll < 5) {
        return { rarity: 'legendary', data: weightedRandom(legendaryRewards) };
    }
    // 25% فرصة لجائزة نادرة
    else if (roll < 30) {
        return { rarity: 'rare', data: weightedRandom(rareRewards) };
    }
    // 70% فرصة لجائزة عادية
    else {
        return { rarity: 'common', data: weightedRandom(commonRewards) };
    }
}

// ========== دالة الحصول على اسم الفئة ==========
function getCategoryName(type) {
    const categories = {
        'points': '💰 نقود',
        'wood': '🪵 خشب',
        'stone': '🪨 حجر',
        'iron': '⛏️ حديد',
        'weapon': '⚔️ سلاح',
        'soldier': '👥 جندي',
        'accessory': '💍 إكسسوار',
        'potion': '🧪 جرعة',
        'soulPage': '📖 صفحات روح',
        'companion': '🐦 رفيق',
        'spell': '🔮 تعويذة'
    };
    return categories[type] || '🎁 جائزة';
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `🎁 كـنـز الـمـمـلـكـة 🎁\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['كنز'],
    description: '🎁 البحث عن كنز يومي في مملكتك (جوائز عشوائية متنوعة)',
    category: 'مملكة',
    usage: '.كنز',
    example: '.كنز',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            // ===== 1. التحقق من وجود مملكة =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                    '📌 استخدم .لاعب جديد لتأسيس مملكتك.'
                ], msg, [sender]);
                return;
            }

            // ===== 2. تحميل بيانات الكنز والتحقق من التبريد =====
            const treasure = loadTreasure();
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            if (treasure[sender] && (now - treasure[sender]) < oneDay) {
                const remaining = oneDay - (now - treasure[sender]);
                const hoursLeft = Math.floor(remaining / (60 * 60 * 1000));
                const minutesLeft = Math.ceil((remaining % (60 * 60 * 1000)) / (60 * 1000));
                
                await sendMessage(sock, chatId, [
                    `⏳ @${sender.split('@')[0]}، لقد بحثت عن الكنز اليوم بالفعل.`,
                    `📌 يمكنك البحث مرة أخرى بعد ${hoursLeft} ساعة و ${minutesLeft} دقيقة.`,
                    `💡 عد غداً للحصول على كنز جديد!`
                ], msg, [sender]);
                return;
            }

            // ===== 3. تحميل بيانات المستخدم =====
            const points = loadJSON(pointsPath);
            let user = loadUserData(sender);

            // ===== 4. توليد الجائزة =====
            const reward = generateReward();
            const { rarity, data } = reward;
            let rewardText = '';

            // ===== 5. تطبيق الجائزة =====
            if (data.type === 'points') {
                points[sender] = (points[sender] || 0) + data.amount;
                rewardText = `💰 ربحت ${data.amount} نقطة!`;
            } 
            else if (data.type === 'wood') {
                user.resources.wood = (user.resources.wood || 0) + data.amount;
                rewardText = `🪵 ربحت ${data.amount} خشب!`;
            } 
            else if (data.type === 'stone') {
                user.resources.stone = (user.resources.stone || 0) + data.amount;
                rewardText = `🪨 ربحت ${data.amount} حجر!`;
            } 
            else if (data.type === 'iron') {
                user.resources.iron = (user.resources.iron || 0) + data.amount;
                rewardText = `⛏️ ربحت ${data.amount} حديد!`;
            } 
            else if (data.type === 'weapon') {
                user.weapons[data.key] = (user.weapons[data.key] || 0) + (data.count || 1);
                rewardText = `⚔️ ربحت ${data.name} × ${data.count || 1}!`;
            } 
            else if (data.type === 'soldier') {
                user.soldiers[data.key] = (user.soldiers[data.key] || 0) + (data.count || 1);
                rewardText = `👥 ربحت ${data.count || 1} × ${data.name}!`;
            } 
            else if (data.type === 'accessory') {
                user.accessories[data.key] = (user.accessories[data.key] || 0) + (data.count || 1);
                rewardText = `💍 ربحت ${data.name} × ${data.count || 1}!`;
            } 
            else if (data.type === 'potion') {
                user.potions[data.key] = (user.potions[data.key] || 0) + (data.count || 1);
                rewardText = `🧪 ربحت ${data.count || 1} × ${data.name}!`;
            } 
            else if (data.type === 'soulPage') {
                user.soulBook.pages = (user.soulBook.pages || 0) + data.amount;
                rewardText = `📖 ربحت ${data.amount} صفحة روح!`;
            } 
            else if (data.type === 'companion') {
                user.companion = { name: data.name, power: data.power };
                rewardText = `🐦 ربحت ${data.name} (قوته ${data.power}%)!`;
            } 
            else if (data.type === 'spell') {
                user.spellsUsed[data.key] = (user.spellsUsed[data.key] || 0) + (data.count || 1);
                rewardText = `🔮 ربحت ${data.name}!`;
            }

            // ===== 6. تحديث وقت الكنز =====
            treasure[sender] = now;
            saveTreasure(treasure);

            // ===== 7. حفظ البيانات =====
            saveJSON(pointsPath, points);
            saveUserData(sender, user);

            // ===== 8. تحديد الندرة والإيموجي =====
            const rarityNames = {
                'common': '📦 عادي',
                'rare': '✨ نادر',
                'legendary': '⭐ أسطوري!'
            };
            const rarityEmojis = {
                'common': '📦',
                'rare': '✨',
                'legendary': '🌟'
            };

            // ===== 9. بناء الرسالة =====
            const categoryName = getCategoryName(data.type);
            const lines = [
                `👑 @${sender.split('@')[0]}`,
                ``,
                `${rarityEmojis[rarity]} *لقد وجدت كنزاً!*`,
                `📦 الفئة: ${categoryName}`,
                `🏷️ الندرة: ${rarityNames[rarity]}`,
                `📋 الجائزة: ${rewardText}`,
                ``,
                `📊 *مملكتك الآن:*`,
                `💰 نقاط: ${points[sender] || 0}`,
                `🪵 خشب: ${user.resources.wood || 0}`,
                `🪨 حجر: ${user.resources.stone || 0}`,
                `⛏️ حديد: ${user.resources.iron || 0}`,
                `📖 صفحات روح: ${user.soulBook.pages || 0}`,
                ...(user.companion ? [`🐦 الرفيق: ${user.companion.name}`] : []),
                ``,
                `📌 عد غداً للحصول على كنز جديد!`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر كنز:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء البحث عن الكنز.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};