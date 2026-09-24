// تطور.js - رفع مستوى المملكة (لا نهائي، حد أقصى 1000 مستوى لكل أمر، مع نظام استراحة) - سعر ثابت 750 نقطة لكل مستوى
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
const ACTIVE_PATH = path.join(dataDir, 'kd-active.json');

// ===== التأكد من وجود جميع الملفات =====
const allPaths = [MAIN_PATH, SOLDIERS_PATH, WEAPONS_PATH, ACCESSORIES_PATH, ACTIVE_PATH];
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
        console.error('❌ فشل حفظ الملف:', file, e.message);
        return false;
    }
}

// ===== الحد الأقصى لعدد المستويات التي يمكن زيادتها في أمر واحد =====
const MAX_LEVEL_PER_UPGRADE = 800;

// ===== نظام الاستراحة: بعد 30 استخدام للأمر في اليوم، استراحة 10 دقائق =====
const MAX_UPGRADE_USAGE_PER_DAY = 30;
const REST_TIME_MS = 10 * 60 * 1000; // 10 دقائق

// ===== سعر التطور الثابت =====
const UPGRADE_COST = 750; // سعر ثابت لكل مستوى

// ========== دوال التخزين المنفصل ==========
function loadUserData(jid) {
    const main = loadJSON(MAIN_PATH)[jid] || {};
    const soldiers = loadJSON(SOLDIERS_PATH)[jid] || {};
    const weapons = loadJSON(WEAPONS_PATH)[jid] || {};
    const accessories = loadJSON(ACCESSORIES_PATH)[jid] || {};
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
        upgradeCountToday: active.upgradeCountToday || 0,
        lastUpgradeReset: active.lastUpgradeReset || 0,
        upgradeRestStage: active.upgradeRestStage || 0,
        upgradeRestStartTime: active.upgradeRestStartTime || 0,
        upgradeCountSinceRest: active.upgradeCountSinceRest || 0,
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

    const active = loadJSON(ACTIVE_PATH);
    active[jid] = {
        upgradeCountToday: data.upgradeCountToday || 0,
        lastUpgradeReset: data.lastUpgradeReset || 0,
        upgradeRestStage: data.upgradeRestStage || 0,
        upgradeRestStartTime: data.upgradeRestStartTime || 0,
        upgradeCountSinceRest: data.upgradeCountSinceRest || 0,
        lastActive: data.lastActive || Date.now()
    };
    saveJSON(ACTIVE_PATH, active);
}

function userExists(jid) {
    const main = loadJSON(MAIN_PATH);
    return !!main[jid];
}

// ===== سعر التطور الثابت =====
function getUpgradeCost(level) {
    return UPGRADE_COST; // 750 نقطة ثابتة لكل مستوى
}

function calculateStats(level, soldiers, weapons, accessories) {
    soldiers = soldiers || {};
    weapons = weapons || {};
    accessories = accessories || {};
    let baseHealth = 100 + (level - 1) * 20;
    let baseAttack = 10 + (level - 1) * 5;
    let baseDefense = 5 + (level - 1) * 3;
    let totalAttack = baseAttack
        + (soldiers.normal || 0) * 2
        + (soldiers.knight || 0) * 5
        + (soldiers.archer || 0) * 4
        + (soldiers.eliteGuard || 0) * 8
        + (soldiers.dragonSpearman || 0) * 15
        + (soldiers.legendaryCommander || 0) * 30
        + (weapons.ironSword || 0) * 10
        + (weapons.legendaryBow || 0) * 20
        + (weapons.lightningSword || 0) * 40
        + (weapons.giantHammer || 0) * 60
        + (weapons.deathBow || 0) * 80
        + (weapons.destructionAxe || 0) * 100
        + (weapons.heroSword || 0) * 50
        + (weapons.timeBow || 0) * 70
        + (weapons.eternalBlade || 0) * 120
        + (accessories.powerRing || 0) * 10
        + (accessories.kingsCrown || 0) * 30
        + (accessories.heroMask || 0) * 20;
    let totalDefense = baseDefense
        + (soldiers.knight || 0) * 2
        + (soldiers.eliteGuard || 0) * 4
        + (soldiers.dragonSpearman || 0) * 8
        + (soldiers.legendaryCommander || 0) * 15
        + (weapons.goldenShield || 0) * 15
        + (weapons.fireShield || 0) * 40
        + (weapons.godShield || 0) * 80
        + (accessories.protectionRing || 0) * 10
        + (accessories.kingsCrown || 0) * 30
        + (accessories.shadowMask || 0) * 15
        + (accessories.heroMask || 0) * 20;
    return { health: baseHealth, attack: totalAttack, defense: totalDefense };
}

function sanitizeUser(user) {
    if (!user) return null;
    if (user.level === undefined || user.level === null) user.level = 1;
    if (user.prosperity === undefined || user.prosperity === null) user.prosperity = 0;
    if (user.lands === undefined || user.lands === null) user.lands = 0;
    if (user.gold === undefined || user.gold === null) user.gold = 0;
    if (user.monstersDefeated === undefined || user.monstersDefeated === null) user.monstersDefeated = 0;
    if (user.pvpWins === undefined || user.pvpWins === null) user.pvpWins = 0;
    if (user.pvpLosses === undefined || user.pvpLosses === null) user.pvpLosses = 0;
    if (user.name === undefined || user.name === null) user.name = `مملكة @${user.owner?.split('@')[0] || 'غير معروف'}`;
    if (user.nameChangesUsed === undefined || user.nameChangesUsed === null) user.nameChangesUsed = 0;
    if (!user.resources) user.resources = { wood: 0, stone: 0, iron: 0 };
    if (user.resources.wood === undefined || user.resources.wood === null) user.resources.wood = 0;
    if (user.resources.stone === undefined || user.resources.stone === null) user.resources.stone = 0;
    if (user.resources.iron === undefined || user.resources.iron === null) user.resources.iron = 0;
    if (!user.buildings) user.buildings = { barracks: { level: 0 }, quarry: { level: 0 }, lumberMill: { level: 0 }, ironMine: { level: 0 } };
    if (user.buildings.barracks === undefined) user.buildings.barracks = { level: 0 };
    if (user.buildings.quarry === undefined) user.buildings.quarry = { level: 0 };
    if (user.buildings.lumberMill === undefined) user.buildings.lumberMill = { level: 0 };
    if (user.buildings.ironMine === undefined) user.buildings.ironMine = { level: 0 };
    if (user.buildings.barracks.level === undefined || user.buildings.barracks.level === null) user.buildings.barracks.level = 0;
    if (user.buildings.quarry.level === undefined || user.buildings.quarry.level === null) user.buildings.quarry.level = 0;
    if (user.buildings.lumberMill.level === undefined || user.buildings.lumberMill.level === null) user.buildings.lumberMill.level = 0;
    if (user.buildings.ironMine.level === undefined || user.buildings.ironMine.level === null) user.buildings.ironMine.level = 0;
    if (!user.soldiers) user.soldiers = {};
    const soldierTypes = ['normal', 'knight', 'archer', 'eliteGuard', 'dragonSpearman', 'legendaryCommander'];
    for (const t of soldierTypes) if (user.soldiers[t] === undefined || user.soldiers[t] === null) user.soldiers[t] = 0;
    if (!user.weapons) user.weapons = {};
    const weaponTypes = ['ironSword', 'goldenShield', 'legendaryBow', 'lightningSword', 'giantHammer', 'deathBow', 'destructionAxe', 'heroSword', 'timeBow', 'eternalBlade', 'fireShield', 'godShield'];
    for (const t of weaponTypes) if (user.weapons[t] === undefined || user.weapons[t] === null) user.weapons[t] = 0;
    if (!user.accessories) user.accessories = {};
    const accessoryTypes = ['powerRing', 'protectionRing', 'kingsCrown', 'shadowMask', 'heroMask'];
    for (const t of accessoryTypes) if (user.accessories[t] === undefined || user.accessories[t] === null) user.accessories[t] = 0;
    if (!user.potions) user.potions = {};
    const potionTypes = ['smallHeal', 'largeHeal', 'energyPotion', 'craftedHeal'];
    for (const t of potionTypes) if (user.potions[t] === undefined || user.potions[t] === null) user.potions[t] = 0;
    if (!user.soulBook) user.soulBook = { pages: 0, spirits: [] };
    if (user.soulBook.pages === undefined || user.soulBook.pages === null) user.soulBook.pages = 0;
    if (!user.soulBook.spirits) user.soulBook.spirits = [];
    if (!user.owner) user.owner = user.owner || null;
    if (user.upgradeCountToday === undefined || user.upgradeCountToday === null) user.upgradeCountToday = 0;
    if (user.lastUpgradeReset === undefined || user.lastUpgradeReset === null) user.lastUpgradeReset = 0;
    if (user.upgradeRestStage === undefined || user.upgradeRestStage === null) user.upgradeRestStage = 0;
    if (user.upgradeRestStartTime === undefined || user.upgradeRestStartTime === null) user.upgradeRestStartTime = 0;
    if (user.upgradeCountSinceRest === undefined || user.upgradeCountSinceRest === null) user.upgradeCountSinceRest = 0;
    user.lastActive = Date.now();
    return user;
}

// ========== نظام استراحة التطور ==========
function checkUpgradeRest(user) {
    const now = Date.now();
    const stage = user.upgradeRestStage || 0;
    const startTime = user.upgradeRestStartTime || 0;
    const count = user.upgradeCountSinceRest || 0;

    if (stage === 1) {
        const elapsed = now - startTime;
        if (elapsed >= REST_TIME_MS) {
            user.upgradeRestStage = 0;
            user.upgradeCountSinceRest = 0;
            user.upgradeRestStartTime = 0;
            return { canUpgrade: true, stage: 0, remaining: 0, changed: true };
        } else {
            return { canUpgrade: false, stage: 1, remaining: REST_TIME_MS - elapsed, changed: false };
        }
    }

    if (stage === 0) {
        const today = new Date().toDateString();
        const lastResetDate = user.lastUpgradeReset ? new Date(user.lastUpgradeReset).toDateString() : null;
        if (lastResetDate !== today) {
            user.upgradeCountToday = 0;
            user.lastUpgradeReset = now;
            user.upgradeCountSinceRest = 0;
            return { canUpgrade: true, stage: 0, remaining: 0, changed: true };
        }

        if (user.upgradeCountToday >= MAX_UPGRADE_USAGE_PER_DAY) {
            user.upgradeRestStage = 1;
            user.upgradeRestStartTime = now;
            return { canUpgrade: false, stage: 1, remaining: REST_TIME_MS, changed: true };
        }
        return { canUpgrade: true, stage: 0, remaining: 0, changed: false };
    }

    user.upgradeRestStage = 0;
    user.upgradeCountSinceRest = 0;
    user.upgradeRestStartTime = 0;
    return { canUpgrade: true, stage: 0, remaining: 0, changed: true };
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `📈 الـتـطـويـر 📈\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== تنسيق الوقت ==========
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} يوم ${hours % 24} ساعة ${minutes % 60} دقيقة ${seconds % 60} ثانية`;
    if (hours > 0) return `${hours} ساعة ${minutes % 60} دقيقة ${seconds % 60} ثانية`;
    if (minutes > 0) return `${minutes} دقيقة ${seconds % 60} ثانية`;
    return `${seconds} ثانية`;
}

module.exports = {
    command: 'تطور',
    description: '📈 رفع مستوى مملكتك (لا نهائي، حد أقصى 1000 مستوى لكل أمر، سعر ثابت 750 نقطة)',
    category: 'مملكة',
    usage: '.تطور [عدد المستويات]',
    example: '.تطور 5',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            const body = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
            const args = body.split(/\s+/).slice(1);
            let levelsToUpgrade = 1;

            if (args.length > 0) {
                const num = parseInt(args[0]);
                if (!isNaN(num) && num > 0) {
                    levelsToUpgrade = num;
                } else {
                    await sendMessage(sock, chatId, [
                        `❌ @${sender.split('@')[0]}، الرجاء إدخال عدد صحيح موجب للمستويات.`,
                        '📝 مثال: .تطور 5'
                    ], msg, [sender]);
                    return;
                }
            }

            // ===== تقييد عدد المستويات في المرة الواحدة =====
            if (levelsToUpgrade > MAX_LEVEL_PER_UPGRADE) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، لا يمكنك زيادة أكثر من ${MAX_LEVEL_PER_UPGRADE} مستوى في المرة الواحدة.`,
                    `📌 حاول مرة أخرى بـ ${MAX_LEVEL_PER_UPGRADE} أو أقل.`
                ], msg, [sender]);
                return;
            }

            const points = loadJSON(pointsPath);

            // ===== التحقق من وجود مملكة =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                    '📌 استخدم .لاعب جديد لتأسيس مملكتك.'
                ], msg, [sender]);
                return;
            }

            let user = loadUserData(sender);
            user = sanitizeUser(user);
            let playerPoints = points[sender] || 0;
            const oldLevel = user.level;

            // ===== التحقق من نظام الاستراحة =====
            const restStatus = checkUpgradeRest(user);
            if (restStatus.changed) {
                saveUserData(sender, user);
            }

            if (!restStatus.canUpgrade) {
                const remainingTime = formatTime(restStatus.remaining);
                await sendMessage(sock, chatId, [
                    `⏳ *استرح قليلاً يا @${sender.split('@')[0]}*`,
                    ``,
                    `📌 لقد استنفذت حد التطور اليومي (${MAX_UPGRADE_USAGE_PER_DAY})`,
                    `⏳ المتبقي: *${remainingTime}*`,
                    ``,
                    `💡 عد بعد انتهاء الوقت`
                ], msg, [sender]);
                return;
            }

            // ===== حساب التكلفة الإجمالية (سعر ثابت 750 لكل مستوى) =====
            const totalCost = levelsToUpgrade * UPGRADE_COST;

            if (playerPoints < totalCost) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، رصيدك لا يكفي!`,
                    `💰 تحتاج ${totalCost} نقطة لرفع ${levelsToUpgrade} مستوى (${UPGRADE_COST} نقطة لكل مستوى)`,
                    `🪙 رصيدك: ${playerPoints} نقطة`,
                    `💔 تحتاج: ${totalCost - playerPoints} نقطة إضافية`
                ], msg, [sender]);
                return;
            }

            // ===== خصم النقاط =====
            points[sender] = playerPoints - totalCost;

            // ===== رفع المستوى =====
            const oldStats = calculateStats(oldLevel, user.soldiers, user.weapons, user.accessories);
            user.level += levelsToUpgrade;
            user.prosperity += 50 * levelsToUpgrade;
            user.lands += 5 * levelsToUpgrade;
            user.lastActive = Date.now();

            // تحديث عداد التطور
            user.upgradeCountToday = (user.upgradeCountToday || 0) + 1;
            user.upgradeCountSinceRest = (user.upgradeCountSinceRest || 0) + 1;
            if (!user.lastUpgradeReset) user.lastUpgradeReset = Date.now();

            // ===== حساب الإحصائيات الجديدة =====
            const newStats = calculateStats(user.level, user.soldiers, user.weapons, user.accessories);

            // ===== حفظ البيانات =====
            saveJSON(pointsPath, points);
            saveUserData(sender, user);

            // ===== رسالة النجاح =====
            const remainingToday = Math.max(0, MAX_UPGRADE_USAGE_PER_DAY - user.upgradeCountToday);
            const lines = [
                `⚔️ *تطور ضخم!*`,
                '',
                `👑 @${sender.split('@')[0]}`,
                `✨ المستوى: ${oldLevel} → ${user.level} (+${levelsToUpgrade})`,
                `❤️ الصحة: ${oldStats.health} → ${newStats.health}`,
                `⚔️ الهجوم: ${oldStats.attack} → ${newStats.attack}`,
                `🛡️ الدفاع: ${oldStats.defense} → ${newStats.defense}`,
                `📈 الازدهار: +${50 * levelsToUpgrade} (الإجمالي: ${user.prosperity})`,
                `🗺️ الأراضي: +${5 * levelsToUpgrade} (الإجمالي: ${user.lands})`,
                `💰 التكلفة: ${totalCost} نقطة (${UPGRADE_COST} نقطة لكل مستوى)`,
                `🪙 رصيدك: ${points[sender]} نقطة`,
                `📊 متبقي اليوم: ${remainingToday} تطور`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر تطور:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء التطوير.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};