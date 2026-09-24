// تلقائي.js - تطور تلقائي + شراء من المتجر (جميع المنتجات المتاحة)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
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
const allPaths = [MAIN_PATH, SOLDIERS_PATH, WEAPONS_PATH, ACCESSORIES_PATH, POTIONS_PATH, SPELLS_PATH, SOULBOOK_PATH, COMPANION_PATH, STATS_PATH, ACTIVE_PATH];
for (const p of allPaths) {
    if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));

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

// ========== قائمة المنتجات الكاملة من المتجر (حسب الصورة المرفقة) ==========
const shopItems = [
    // ===== أسلحة =====
    { key: 'ironSword', name: 'سيف حديدي', type: 'weapon', cost: 150, priority: 10 },
    { key: 'goldenShield', name: 'درع ذهبي', type: 'weapon', cost: 250, priority: 11 },
    { key: 'legendaryBow', name: 'قوس أسطوري', type: 'weapon', cost: 300, priority: 12 },
    { key: 'lightningSword', name: 'سيف البرق', type: 'weapon', cost: 400, priority: 13 },
    { key: 'giantHammer', name: 'مطرقة العمالقة', type: 'weapon', cost: 550, priority: 14 },
    { key: 'deathBow', name: 'قوس الموت', type: 'weapon', cost: 700, priority: 15 },
    { key: 'destructionAxe', name: 'فأس الدمار', type: 'weapon', cost: 900, priority: 16 },
    { key: 'heroSword', name: 'سيف الأبطال', type: 'weapon', cost: 500, priority: 17 },
    { key: 'timeBow', name: 'قوس الزمن', type: 'weapon', cost: 850, priority: 18 },
    { key: 'eternalBlade', name: 'نصل الأبدية', type: 'weapon', cost: 1500, priority: 19 },
    { key: 'fireShield', name: 'درع النار', type: 'weapon', cost: 450, priority: 20 },
    { key: 'godShield', name: 'درع ملك', type: 'weapon', cost: 800, priority: 21 },

    // ===== جنود =====
    { key: 'normal', name: 'جندي عادي', type: 'soldier', cost: 30, priority: 30 },
    { key: 'archer', name: 'رامٍ', type: 'soldier', cost: 50, priority: 31 },
    { key: 'knight', name: 'فارس', type: 'soldier', cost: 80, priority: 32 },
    { key: 'eliteGuard', name: 'حارس النخبة', type: 'soldier', cost: 150, priority: 33 },
    { key: 'dragonSpearman', name: 'منشق التنين', type: 'soldier', cost: 300, priority: 34 },
    { key: 'legendaryCommander', name: 'قائد أسطوري', type: 'soldier', cost: 600, priority: 35 },

    // ===== إكسسوارات =====
    { key: 'powerRing', name: 'خاتم القوة', type: 'accessory', cost: 200, priority: 50 },
    { key: 'protectionRing', name: 'خاتم الحماية', type: 'accessory', cost: 200, priority: 51 },
    { key: 'shadowMask', name: 'قناع الظل', type: 'accessory', cost: 400, priority: 52 },
    { key: 'heroMask', name: 'قناع البطل', type: 'accessory', cost: 700, priority: 53 },
    { key: 'kingsCrown', name: 'تاج الملوك', type: 'accessory', cost: 900, priority: 54 },

    // ===== جرعات =====
    { key: 'smallHeal', name: 'جرعة شفاء صغيرة', type: 'potion', cost: 50, priority: 70 },
    { key: 'largeHeal', name: 'جرعة شفاء كبيرة', type: 'potion', cost: 150, priority: 71 },
    { key: 'energyPotion', name: 'جرعة الطاقة', type: 'potion', cost: 200, priority: 72 },
    { key: 'craftedHeal', name: 'جرعة شفاء مصنعة', type: 'potion', cost: 300, priority: 73 },

    // ===== رفقاء (يتم التعامل معهم بشكل خاص) =====
    { key: 'darkWolf', name: 'ذئب الظلام', type: 'companion', cost: 350, priority: 90 },
    { key: 'iceEagle', name: 'نسر الجليد', type: 'companion', cost: 450, priority: 91 },
    { key: 'dragon', name: 'تنين أسطوري', type: 'companion', cost: 600, priority: 92 },
    { key: 'otherworldDragon', name: 'تنين العالم الآخر', type: 'companion', cost: 1200, priority: 93 },

    // ===== صفحات روح =====
    { key: 'soulPage', name: 'صفحة روح نادرة', type: 'soulPage', cost: 100, priority: 110 },
    { key: 'soulPage3', name: '3 صفحات روح', type: 'soulPage', cost: 250, priority: 111 },
    { key: 'soulPage5', name: '5 صفحات روح', type: 'soulPage', cost: 400, priority: 112 },
    { key: 'soulPageDark', name: 'صفحة روح الظلام', type: 'soulPage', cost: 600, priority: 113 },

    // ===== تعاويذ (مرة واحدة يومياً) =====
    { key: 'dragonFlame', name: 'لهيب التنين', type: 'spell', cost: 120, priority: 130 },
    { key: 'kingsHeal', name: 'شفاء الملك', type: 'spell', cost: 100, priority: 131 },
    { key: 'lightningStorm', name: 'عاصفة البرق', type: 'spell', cost: 150, priority: 132 },
    { key: 'ragingBull', name: 'الثور الهائج', type: 'spell', cost: 180, priority: 133 },
    { key: 'freeze', name: 'تجمد', type: 'spell', cost: 160, priority: 134 },
    { key: 'cyclone', name: 'إعصار', type: 'spell', cost: 200, priority: 135 },
    { key: 'curse', name: 'لعنة الموت', type: 'spell', cost: 400, priority: 136 }
];

// ========== حساب تكلفة التطور ==========
function getUpgradeCost(level) {
    return 750; // سعر ثابت لكل مستوى
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `🤖 التـطـويـر الـتـلـقـائـي 🤖\n`;
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
    command: ['تلقائي'],
    description: '🤖 تطور تلقائي للمملكة (حد أقصى 800 مستوى) + شراء من جميع فئات المتجر (حد أقصى 100 قطعة لكل صنف) مع حد إنفاق 1,500,000 نقطة لكل أمر',
    category: 'مملكة',
    usage: '.تلقائي',
    example: '.تلقائي',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            // ===== التحقق من وجود مملكة =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                    '📌 استخدم .لاعب جديد لتأسيس مملكتك.'
                ], msg, [sender]);
                return;
            }

            // ===== تحميل البيانات =====
            const points = loadJSON(pointsPath);
            let user = loadUserData(sender);
            let userPoints = points[sender] || 0;

            // ===== الحدود =====
            const MAX_LEVEL_PER_AUTO = 800;
            const MAX_PER_ITEM = 100;
            const MAX_SPENDING_PER_AUTO = 1500000;

            let remainingPoints = userPoints;
            let spentOnUpgrade = 0;
            let totalUpgradeCost = 0;
            let levelsBought = 0;
            let currentLevel = user.level;

            // ===== 1. التطور التلقائي =====
            let targetLevel = currentLevel + MAX_LEVEL_PER_AUTO;
            while (currentLevel < targetLevel) {
                const cost = getUpgradeCost(currentLevel);
                if (remainingPoints < cost) break;
                if (spentOnUpgrade + cost > MAX_SPENDING_PER_AUTO) break;
                remainingPoints -= cost;
                spentOnUpgrade += cost;
                totalUpgradeCost += cost;
                currentLevel++;
                levelsBought++;
            }

            const oldLevel = user.level;
            user.level = currentLevel;
            user.prosperity += 50 * levelsBought;
            user.lands += 5 * levelsBought;
            user.lastActive = Date.now();

            // ===== 2. الشراء التلقائي =====
            let itemsBought = [];
            let totalSpent = 0;
            let spentOnItems = 0;

            // ترتيب حسب الأولوية
            const sortedItems = shopItems.sort((a, b) => a.priority - b.priority);

            for (const item of sortedItems) {
                let boughtCount = 0;

                // نشتري 100 قطعة من كل صنف (بغض النظر عن الكمية الموجودة)
                while (remainingPoints >= item.cost && boughtCount < MAX_PER_ITEM) {
                    if (spentOnUpgrade + spentOnItems + item.cost > MAX_SPENDING_PER_AUTO) break;
                    remainingPoints -= item.cost;
                    totalSpent += item.cost;
                    spentOnItems += item.cost;
                    boughtCount++;

                    // إضافة العنصر حسب نوعه
                    if (item.type === 'weapon') {
                        user.weapons[item.key] = (user.weapons[item.key] || 0) + 1;
                    } else if (item.type === 'soldier') {
                        user.soldiers[item.key] = (user.soldiers[item.key] || 0) + 1;
                    } else if (item.type === 'accessory') {
                        user.accessories[item.key] = (user.accessories[item.key] || 0) + 1;
                    } else if (item.type === 'potion') {
                        user.potions[item.key] = (user.potions[item.key] || 0) + 1;
                    } else if (item.type === 'companion') {
                        // الرفيق: يتم استبداله بالرفيق الجديد (إذا كان أفضل)
                        user.companion = { name: item.name, power: getCompanionPower(item.key) };
                    } else if (item.type === 'soulPage') {
                        let pages = 0;
                        if (item.key === 'soulPage') pages = 1;
                        else if (item.key === 'soulPage3') pages = 3;
                        else if (item.key === 'soulPage5') pages = 5;
                        else if (item.key === 'soulPageDark') pages = 5;
                        user.soulBook.pages = (user.soulBook.pages || 0) + pages;
                    } else if (item.type === 'spell') {
                        // التعاويذ: نضيفها كاستخدام (مرة واحدة يومياً)
                        user.spellsUsed[item.key] = (user.spellsUsed[item.key] || 0) + 1;
                    }
                }

                if (boughtCount > 0) {
                    itemsBought.push(`${item.name} × ${boughtCount}`);
                }

                if (spentOnUpgrade + spentOnItems >= MAX_SPENDING_PER_AUTO) break;
                const minCost = sortedItems.reduce((min, i) => Math.min(min, i.cost), Infinity);
                if (remainingPoints < minCost) break;
            }

            // ===== حفظ التغييرات =====
            points[sender] = remainingPoints;
            saveJSON(pointsPath, points);
            saveUserData(sender, user);

            // ===== بناء الرسالة =====
            const totalSpentAll = totalUpgradeCost + totalSpent;
            const lines = [
                `👑 @${sender.split('@')[0]}`,
                '',
                `📈 *التطور:*`,
                `   المستوى: ${oldLevel} → ${user.level} (+${levelsBought})`,
                `   تكلفة التطور: ${totalUpgradeCost.toLocaleString()} نقطة`,
                '',
                `🛒 *المشتريات:*`,
                itemsBought.length > 0 ? itemsBought.map(i => `   • ${i}`).join('\n') : '   لا توجد مشتريات جديدة',
                '',
                `💰 *النقاط المتبقية:* ${remainingPoints.toLocaleString()} نقطة`,
                `📊 *إجمالي المصروف:* ${totalSpentAll.toLocaleString()} نقطة`,
                '',
                `📌 استخدم .مملكتي لعرض التفاصيل الكاملة.`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر تلقائي:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء التطور التلقائي.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};

// ========== دالة مساعدة لقوة الرفيق ==========
function getCompanionPower(key) {
    const powers = {
        'darkWolf': 10,
        'iceEagle': 12,
        'dragon': 15,
        'otherworldDragon': 25
    };
    return powers[key] || 10;
}