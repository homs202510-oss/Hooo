// وحش.js - محاربة وحش بمستوى محدد (نظام متطور) - نسخة متوافقة مع نظام التخزين المنفصل مع إصلاح نظام الاستراحة
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const questPath = path.join(__dirname, 'db-quests.json');
const bankPath = path.join(__dirname, 'db-bank.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const RESOURCES_PATH = path.join(dataDir, 'kd-resources.json');
const BUILDINGS_PATH = path.join(dataDir, 'kd-buildings.json');
const SOLDIERS_PATH = path.join(dataDir, 'kd-soldiers.json');
const WEAPONS_PATH = path.join(dataDir, 'kd-weapons.json');
const ACCESSORIES_PATH = path.join(dataDir, 'kd-accessories.json');
const POTIONS_PATH = path.join(dataDir, 'kd-potions.json');
const SPELLS_PATH = path.join(dataDir, 'kd-spells.json');
const STATS_PATH = path.join(dataDir, 'kd-stats.json');
const ACTIVE_PATH = path.join(dataDir, 'kd-active.json');
const SOULBOOK_PATH = path.join(dataDir, 'kd-soulbook.json');
const COMPANION_PATH = path.join(dataDir, 'kd-companion.json');

// ===== التأكد من وجود جميع الملفات =====
const allPaths = [MAIN_PATH, RESOURCES_PATH, BUILDINGS_PATH, SOLDIERS_PATH, WEAPONS_PATH, ACCESSORIES_PATH, POTIONS_PATH, SPELLS_PATH, STATS_PATH, ACTIVE_PATH, SOULBOOK_PATH, COMPANION_PATH];
for (const p of allPaths) {
    if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(questPath)) fs.writeFileSync(questPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(bankPath)) fs.writeFileSync(bankPath, JSON.stringify({}, null, 2));

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

// ========== دوال التخزين المنفصل ==========
function loadUserData(jid) {
    const main = loadJSON(MAIN_PATH)[jid] || {};
    const resources = loadJSON(RESOURCES_PATH)[jid] || {};
    const buildings = loadJSON(BUILDINGS_PATH)[jid] || {};
    const soldiers = loadJSON(SOLDIERS_PATH)[jid] || {};
    const weapons = loadJSON(WEAPONS_PATH)[jid] || {};
    const accessories = loadJSON(ACCESSORIES_PATH)[jid] || {};
    const potions = loadJSON(POTIONS_PATH)[jid] || {};
    const spells = loadJSON(SPELLS_PATH)[jid] || {};
    const stats = loadJSON(STATS_PATH)[jid] || {};
    const active = loadJSON(ACTIVE_PATH)[jid] || {};
    const soulBook = loadJSON(SOULBOOK_PATH)[jid] || {};
    const companion = loadJSON(COMPANION_PATH)[jid] || null;

    return {
        level: main.level || 1,
        prosperity: main.prosperity || 0,
        lands: main.lands || 0,
        gold: main.gold || 0,
        name: main.name || `مملكة @${jid.split('@')[0]}`,
        owner: main.owner || jid,
        nameChangesUsed: main.nameChangesUsed || 0,
        resources: resources,
        buildings: buildings,
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
        lastActive: active.lastActive || 0,
        lastDaily: active.lastDaily || 0,
        lastAttack: active.lastAttack || 0,
        attacksToday: active.attacksToday || 0,
        lastAttackReset: active.lastAttackReset || 0,
        attackRestStage: active.attackRestStage || 0,
        attackRestStartTime: active.attackRestStartTime || 0,
        attackCountSinceRest: active.attackCountSinceRest || 0,
        lastMonsterFight: active.lastMonsterFight || 0,
        monsterFightCount: active.monsterFightCount || 0,
        restStage: active.restStage || 0,
        restStartTime: active.restStartTime || 0,
        lastSpellReset: active.lastSpellReset || 0,
        totalSpellsUsedWeekly: active.totalSpellsUsedWeekly || 0,
        upgradeCountToday: active.upgradeCountToday || 0,
        lastUpgradeReset: active.lastUpgradeReset || 0,
        upgradeRestStage: active.upgradeRestStage || 0,
        upgradeRestStartTime: active.upgradeRestStartTime || 0,
        upgradeCountSinceRest: active.upgradeCountSinceRest || 0,
        spellEffects: active.spellEffects || {}
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
    resources[jid] = data.resources || { wood: 0, stone: 0, iron: 0 };
    saveJSON(RESOURCES_PATH, resources);

    const buildings = loadJSON(BUILDINGS_PATH);
    buildings[jid] = data.buildings || {};
    saveJSON(BUILDINGS_PATH, buildings);

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

    const stats = loadJSON(STATS_PATH);
    stats[jid] = {
        pvpWins: data.pvpWins || 0,
        pvpLosses: data.pvpLosses || 0,
        monstersDefeated: data.monstersDefeated || 0
    };
    saveJSON(STATS_PATH, stats);

    const active = loadJSON(ACTIVE_PATH);
    active[jid] = {
        lastActive: data.lastActive || Date.now(),
        lastDaily: data.lastDaily || 0,
        lastAttack: data.lastAttack || 0,
        attacksToday: data.attacksToday || 0,
        lastAttackReset: data.lastAttackReset || 0,
        attackRestStage: data.attackRestStage || 0,
        attackRestStartTime: data.attackRestStartTime || 0,
        attackCountSinceRest: data.attackCountSinceRest || 0,
        lastMonsterFight: data.lastMonsterFight || 0,
        monsterFightCount: data.monsterFightCount || 0,
        restStage: data.restStage || 0,
        restStartTime: data.restStartTime || 0,
        lastSpellReset: data.lastSpellReset || 0,
        totalSpellsUsedWeekly: data.totalSpellsUsedWeekly || 0,
        upgradeCountToday: data.upgradeCountToday || 0,
        lastUpgradeReset: data.lastUpgradeReset || 0,
        upgradeRestStage: data.upgradeRestStage || 0,
        upgradeRestStartTime: data.upgradeRestStartTime || 0,
        upgradeCountSinceRest: data.upgradeCountSinceRest || 0,
        spellEffects: data.spellEffects || {}
    };
    saveJSON(ACTIVE_PATH, active);

    const soulBook = loadJSON(SOULBOOK_PATH);
    soulBook[jid] = data.soulBook || { pages: 0, spirits: [] };
    saveJSON(SOULBOOK_PATH, soulBook);

    const companion = loadJSON(COMPANION_PATH);
    companion[jid] = data.companion || null;
    saveJSON(COMPANION_PATH, companion);
}

function userExists(jid) {
    const main = loadJSON(MAIN_PATH);
    return !!main[jid];
}

// ========== دالة استخراج النص ==========
function getMessageText(msg) {
    try {
        if (msg.message?.conversation) return msg.message.conversation;
        if (msg.message?.extendedTextMessage?.text) return msg.message.extendedTextMessage.text;
        if (msg.message?.imageMessage?.caption) return msg.message.imageMessage.caption;
        if (msg.message?.videoMessage?.caption) return msg.message.videoMessage.caption;
        if (msg.message?.documentMessage?.caption) return msg.message.documentMessage.caption;
        if (msg.message?.buttonsResponseMessage?.selectedDisplayText)
            return msg.message.buttonsResponseMessage.selectedDisplayText;
        if (msg.message?.listResponseMessage?.singleSelectReply?.selectedDisplayText)
            return msg.message.listResponseMessage.singleSelectReply.selectedDisplayText;
        for (const key of Object.keys(msg.message || {})) {
            if (msg.message[key]?.text) return msg.message[key].text;
            if (msg.message[key]?.caption) return msg.message[key].caption;
        }
        return '';
    } catch {
        return '';
    }
}

// ========== دالة تصحيح بيانات المستخدم ==========
function sanitizeUser(user) {
    if (!user) return null;
    if (user.level === undefined || user.level === null) user.level = 1;
    if (user.level > 2000) user.level = 2000;
    if (user.prosperity === undefined || user.prosperity === null) user.prosperity = 0;
    if (user.lands === undefined || user.lands === null) user.lands = 0;
    if (user.gold === undefined || user.gold === null) user.gold = 0;
    if (user.monstersDefeated === undefined || user.monstersDefeated === null) user.monstersDefeated = 0;
    if (user.pvpWins === undefined || user.pvpWins === null) user.pvpWins = 0;
    if (user.pvpLosses === undefined || user.pvpLosses === null) user.pvpLosses = 0;
    if (user.name === undefined || user.name === null) user.name = `مملكة @${user.owner?.split('@')[0] || 'غير معروف'}`;
    if (user.nameChangesUsed === undefined || user.nameChangesUsed === null) user.nameChangesUsed = 0;
    if (user.lastMonsterFight === undefined || user.lastMonsterFight === null) user.lastMonsterFight = 0;
    if (user.monsterFightCount === undefined || user.monsterFightCount === null) user.monsterFightCount = 0;
    if (user.restStage === undefined || user.restStage === null) user.restStage = 0;
    if (user.restStartTime === undefined || user.restStartTime === null) user.restStartTime = 0;
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
    user.lastActive = Date.now();
    return user;
}

// ========== حساب قوة اللاعب ==========
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

function getPlayerPower(user) {
    const stats = calculateStats(user.level, user.soldiers, user.weapons, user.accessories);
    return stats.attack + stats.defense;
}

function getMonsterPower(level) {
    return Math.floor(20 + (level * 1.5));
}

// ========== حساب نقاط المكافأة حسب مستوى الوحش ==========
function getMonsterRewards(monsterLevel, playerLevel) {
    const monsterPower = getMonsterPower(monsterLevel);
    const points = Math.floor(monsterPower);
    const lands = Math.floor(monsterLevel / 100) + 1;
    const exp = Math.floor(monsterLevel * 0.01) + 1;
    const wood = Math.floor(monsterLevel * 0.8);
    const stone = Math.floor(monsterLevel * 0.5);
    const iron = Math.floor(monsterLevel * 0.3);
    const prosperity = Math.floor(monsterLevel / 50);
    return { points, lands, exp, wood, stone, iron, prosperity };
}

function getMonsterName(level) {
    if (level < 10) return '👹 عفريت صغير';
    if (level < 50) return '🐺 ذئب متوحش';
    if (level < 200) return '🧟 غول مقبرة';
    if (level < 1000) return '🐉 تنين ناري';
    if (level < 5000) return '👑 ملك العفاريت';
    if (level < 20000) return '🐲 التنين الأزرق';
    return '💀 لورد الظلام الأبدي';
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `🐉 مـعـركـة الـوحـش 🐉\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== تنسيق الوقت ==========
function formatTime(ms) {
    if (ms <= 0) return '0 ثانية';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} يوم ${hours % 24} ساعة ${minutes % 60} دقيقة ${seconds % 60} ثانية`;
    if (hours > 0) return `${hours} ساعة ${minutes % 60} دقيقة ${seconds % 60} ثانية`;
    if (minutes > 0) return `${minutes} دقيقة ${seconds % 60} ثانية`;
    return `${seconds} ثانية`;
}

// ========== نظام الاستراحة المتدرج (مع حفظ تلقائي) ==========
function checkRestStatus(user, jid) {
    const now = Date.now();
    const stage = user.restStage || 0;
    const startTime = user.restStartTime || 0;
    const count = user.monsterFightCount || 0;

    // حالة استراحة قصيرة (10 دقائق)
    if (stage === 1) {
        // إذا كان startTime = 0، نضبطه على الآن (لمنع الأخطاء)
        const actualStart = startTime || now;
        const elapsed = now - actualStart;
        const restTime = 10 * 60 * 1000;
        if (elapsed >= restTime) {
            user.restStage = 0;
            user.monsterFightCount = 0;
            user.restStartTime = 0;
            saveUserData(jid, user);
            return { canFight: true, stage: 0, remaining: 0 };
        }
        const remaining = restTime - elapsed;
        return { canFight: false, stage: 1, remaining: remaining };
    }

    // حالة استراحة متوسطة (30 دقيقة)
    if (stage === 3) {
        const actualStart = startTime || now;
        const elapsed = now - actualStart;
        const restTime = 30 * 60 * 1000;
        if (elapsed >= restTime) {
            user.restStage = 0;
            user.monsterFightCount = 0;
            user.restStartTime = 0;
            saveUserData(jid, user);
            return { canFight: true, stage: 0, remaining: 0 };
        }
        const remaining = restTime - elapsed;
        return { canFight: false, stage: 3, remaining: remaining };
    }

    // حالة استراحة طويلة (60 دقيقة)
    if (stage === 5) {
        const actualStart = startTime || now;
        const elapsed = now - actualStart;
        const restTime = 60 * 60 * 1000;
        if (elapsed >= restTime) {
            user.restStage = 0;
            user.monsterFightCount = 0;
            user.restStartTime = 0;
            saveUserData(jid, user);
            return { canFight: true, stage: 0, remaining: 0 };
        }
        const remaining = restTime - elapsed;
        return { canFight: false, stage: 5, remaining: remaining };
    }

    // المرحلة 0: البداية (يسمح بـ 4 معارك)
    if (stage === 0) {
        if (count >= 4) {
            user.restStage = 1;
            user.restStartTime = now;
            user.monsterFightCount = count; // نحتفظ بالعدد
            saveUserData(jid, user);
            return { canFight: false, stage: 1, remaining: 10 * 60 * 1000 };
        }
        return { canFight: true, stage: 0, remaining: 0 };
    }

   // المرحلة 2: بعد الاستراحة الأولى (يسمح بـ 5 معارك)
    if (stage === 2) {
        if (count >= 5) {
            user.restStage = 3;
            user.restStartTime = now;
            user.monsterFightCount = count;
            saveUserData(jid, user);
            return { canFight: false, stage: 3, remaining: 30 * 60 * 1000 };
        }
        return { canFight: true, stage: 2, remaining: 0 };
    }

    // المرحلة 4: بعد الاستراحة الثانية (يسمح بـ 5 معارك)
    if (stage === 4) {
        if (count >= 5) {
            user.restStage = 5;
            user.restStartTime = now;
            user.monsterFightCount = count;
            saveUserData(jid, user);
            return { canFight: false, stage: 5, remaining: 60 * 60 * 1000 };
        }
        return { canFight: true, stage: 4, remaining: 0 };
    }

    return { canFight: true, stage: 0, remaining: 0 };
}

function getRemainingFights(user) {
    const stage = user.restStage || 0;
    const count = user.monsterFightCount || 0;
    if (stage === 0) return Math.max(0, 4 - count);
    if (stage === 2 || stage === 4) return Math.max(0, 5 - count);
    return 0;
}

function getLossPenalty(monsterLevel) {
    const maxPenalty = 5000;
    return Math.min(monsterLevel, maxPenalty);
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: 'وحش',
    description: '🐉 محاربة وحش بمستوى محدد (خسارة تلقائية إذا كان الفرق 50 مستوى فأكثر)',
    category: 'مملكة',
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            const fullText = getMessageText(msg);
            const args = fullText.trim().split(/\s+/);

            if (args.length < 2) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}`,
                    `📌 استخدم: .وحش [مستوى الوحش]`,
                    `📝 مثال: .وحش 5`,
                    ``,
                    `📊 *مستويات الوحوش:*`,
                    `   1-9: 👹 عفريت صغير`,
                    `   10-20: 🐺 ذئب متوحش`,
                    `   21-50: 🧟 غول مقبرة`,
                    `   51-100: 🐉 تنين ناري`,
                    `   101-200: 👑 ملك العفاريت`,
                    `   201-500: 🐲 التنين الأزرق`,
                    `   501-1000: 💀 لورد الظلام`,
                    `   1000+: 👾 وحش أسطوري`
                ], msg, [sender]);
                return;
            }

            const monsterLevelRaw = args[1];
            const monsterLevel = parseInt(monsterLevelRaw);

            // ===== التحقق من صحة الرقم =====
            if (isNaN(monsterLevel) || !isFinite(monsterLevel) || monsterLevel <= 0) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، مستوى الوحش يجب أن يكون رقماً موجباً صحيحاً.`,
                    `📝 مثال: .وحش 5`
                ], msg, [sender]);
                return;
            }

            // ===== الحماية من الأرقام الخيالية الكبيرة جداً =====
            if (monsterLevel > 1000000) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، مستوى الوحش كبير جداً.`,
                    `📌 اختر مستوى أقل من 1,000,000.`
                ], msg, [sender]);
                return;
            }

            // تحميل البيانات
            const points = loadJSON(pointsPath);
            const bankData = loadJSON(bankPath);

            // ===== التحقق من وجود مملكة =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                    `📌 استخدم .لاعب جديد لتأسيس مملكتك.`
                ], msg, [sender]);
                return;
            }

            // ===== تحميل بيانات المستخدم =====
            let user = loadUserData(sender);
            user = sanitizeUser(user);
            saveUserData(sender, user); // حفظ أولي للتأكد من وجود البيانات

            // ===== التحقق من الاستراحة =====
            const restStatus = checkRestStatus(user, sender);

            if (!restStatus.canFight) {
                const remainingTime = formatTime(restStatus.remaining);
                const stageNames = { 
                    1: 'استراحة قصيرة (10 دقائق)', 
                    3: 'استراحة متوسطة (30 دقيقة)', 
                    5: 'استراحة طويلة (1 ساعة)' 
                };
                const stageName = stageNames[restStatus.stage] || 'استراحة';
                await sendMessage(sock, chatId, [
                    `⏳ *استرح قليلاً يا @${sender.split('@')[0]}*`,
                    ``,
                    `📌 ${stageName}`,
                    `⏳ المتبقي: *${remainingTime}*`,
                    `📊 عدد المعارك: ${user.monsterFightCount}/5`,
                    ``,
                    `💡 عد بعد انتهاء الوقت`
                ], msg, [sender]);
                return;
            }

            // ===== حساب القوى =====
            const playerPower = getPlayerPower(user);
            const monsterPower = getMonsterPower(monsterLevel);

            // ===== تحديد نتيجة المعركة =====
            let win = false;
            let autoLose = false;
            let loseReason = '';

            const levelDifference = monsterLevel - user.level;

            if (levelDifference >= 50) {
                autoLose = true;
                loseReason = `الوحش أقوى منك بـ ${levelDifference} مستوى`;
                win = false;
            } else {
                if (playerPower > monsterPower) {
                    win = Math.random() * 100 < 70;
                } else if (playerPower < monsterPower) {
                    win = Math.random() * 100 < 30;
                } else {
                    win = Math.random() * 100 < 50;
                }
            }

            const monsterName = getMonsterName(monsterLevel);
            const rewards = getMonsterRewards(monsterLevel, user.level);
            const lossPenalty = getLossPenalty(monsterLevel);

            // تحديث عدد المعارك
            user.monsterFightCount = (user.monsterFightCount || 0) + 1;
            user.lastMonsterFight = Date.now();
            user.lastActive = Date.now();
            saveUserData(sender, user);

            const lines = [
                `👤 @${sender.split('@')[0]}`,
                `⚔️ يواجه ${monsterName}`,
                `━━━━━━━━━━━━━━━━━━━━`,
                `🛡️ *قوتك:* ${playerPower}`,
                `⚔️ *قوة الوحش:* ${monsterPower}`,
                `📊 *مستوى الوحش:* ${monsterLevel}`,
                `📊 *المعارك المتبقية:* ${getRemainingFights(user)}`
            ];

            if (win) {
                // ===== فوز =====
                const bonusPoints = rewards.points;
                points[sender] = (points[sender] || 0) + bonusPoints;
                user.resources.wood += rewards.wood;
                user.resources.stone += rewards.stone;
                user.resources.iron += rewards.iron;
                user.prosperity += rewards.prosperity;
                user.lands += rewards.lands;
                user.monstersDefeated = (user.monstersDefeated || 0) + 1;
                user.lastActive = Date.now();

                saveJSON(pointsPath, points);
                saveUserData(sender, user);

                // تحديث المهام
                const questData = loadJSON(questPath);
                if (questData[sender]) {
                    if (!questData[sender].progress) questData[sender].progress = {};
                    questData[sender].progress.monster = (questData[sender].progress.monster || 0) + 1;
                    saveJSON(questPath, questData);
                }

                lines.push(
                    ``,
                    `✅ *هزمت الوحش!* 🎉`,
                    `━━━━━━━━━━━━━━━━━━━━`,
                    `🏆 *نقاط المكافأة:* +${bonusPoints}`,
                    `🌍 *أراضي:* +${rewards.lands}`,
                    `✨ *خبرة:* +${rewards.exp}`,
                    `🪵 *خشب:* +${rewards.wood}`,
                    `🪨 *حجر:* +${rewards.stone}`,
                    `⛏️ *حديد:* +${rewards.iron}`,
                    `📈 *ازدهار:* +${rewards.prosperity}`,
                    `━━━━━━━━━━━━━━━━━━━━`,
                    `💰 *نقاطك:* ${points[sender]}`,
                    `💀 *وحوش قتلت:* ${user.monstersDefeated}`
                );
            } else {
                // ===== خسارة =====
                let currentPoints = points[sender] || 0;
                let penalty = lossPenalty;
                let deductedFromPoints = 0;
                let deductedFromBank = 0;

                // خصم من النقاط أولاً
                if (currentPoints > 0) {
                    if (currentPoints >= penalty) {
                        deductedFromPoints = penalty;
                        points[sender] = currentPoints - penalty;
                        penalty = 0;
                    } else {
                        deductedFromPoints = currentPoints;
                        points[sender] = 0;
                        penalty -= currentPoints;
                    }
                }

                // إذا بقى خصم، نخصم من البنك (الوديعة)
                if (penalty > 0) {
                    if (!bankData[sender]) bankData[sender] = { deposit: 0, lastInterest: Date.now() };
                    let deposit = bankData[sender].deposit || 0;
                    if (deposit > 0) {
                        if (deposit >= penalty) {
                            deductedFromBank = penalty;
                            bankData[sender].deposit = deposit - penalty;
                            penalty = 0;
                        } else {
                            deductedFromBank = deposit;
                            bankData[sender].deposit = 0;
                            penalty -= deposit;
                        }
                    }
                }

                // خسارة الموارد
                const lostWood = Math.floor(user.resources.wood * 0.05);
                const lostStone = Math.floor(user.resources.stone * 0.05);
                const lostIron = Math.floor(user.resources.iron * 0.05);
                user.resources.wood = Math.max(0, user.resources.wood - lostWood);
                user.resources.stone = Math.max(0, user.resources.stone - lostStone);
                user.resources.iron = Math.max(0, user.resources.iron - lostIron);
                user.lastActive = Date.now();

                // حفظ التغييرات
                saveJSON(pointsPath, points);
                saveJSON(bankPath, bankData);
                saveUserData(sender, user);

                // رسالة الخسارة
                let lossMsg = [];
                if (autoLose) {
                    lossMsg.push(`⚠️ *خسارة تلقائية!* ${loseReason}`);
                }
                lossMsg.push(
                    ``,
                    `❌ *هزمك الوحش!* 😢`,
                    `━━━━━━━━━━━━━━━━━━━━`,
                    `💔 *خسارة نقاط:*`,
                    `   💰 نقاط: -${deductedFromPoints}`,
                    `   🏦 من البنك: -${deductedFromBank}`,
                    `   🪵 -${lostWood} خشب`,
                    `   🪨 -${lostStone} حجر`,
                    `   ⛏️ -${lostIron} حديد`
                );
                if (penalty > 0) {
                    lossMsg.push(`   ⚠️ متبقي غير مسدد: ${penalty} نقطة (سيتم خصمها لاحقاً)`);
                }
                lossMsg.push(
                    ``,
                    `💰 *رصيدك الحالي:*`,
                    `   نقاط: ${points[sender] || 0}`,
                    `   وديعة البنك: ${bankData[sender]?.deposit || 0}`,
                    `💀 *وحوش قتلت:* ${user.monstersDefeated}`
                );
                lines.push(...lossMsg);
            }

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر وحش:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                `❌ حدث خطأ أثناء محاربة الوحش`,
                `📌 حاول مرة أخرى لاحقاً`
            ], msg);
        }
    }
};