// بحث.js - البحث عن مملكة بالاسم وعرض تصنيفها (بتنسيق موحد) - نسخة متوافقة مع نظام التخزين المنفصل
const fs = require('fs');
const path = require('path');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const SOLDIERS_PATH = path.join(dataDir, 'kd-soldiers.json');
const WEAPONS_PATH = path.join(dataDir, 'kd-weapons.json');
const ACCESSORIES_PATH = path.join(dataDir, 'kd-accessories.json');
const STATS_PATH = path.join(dataDir, 'kd-stats.json');

// ===== التأكد من وجود جميع الملفات =====
const allPaths = [MAIN_PATH, SOLDIERS_PATH, WEAPONS_PATH, ACCESSORIES_PATH, STATS_PATH];
for (const p of allPaths) {
    if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}, null, 2));
}

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
    const soldiers = loadJSON(SOLDIERS_PATH)[jid] || {};
    const weapons = loadJSON(WEAPONS_PATH)[jid] || {};
    const accessories = loadJSON(ACCESSORIES_PATH)[jid] || {};
    const stats = loadJSON(STATS_PATH)[jid] || {};

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
        pvpWins: stats.pvpWins || 0,
        pvpLosses: stats.pvpLosses || 0,
        monstersDefeated: stats.monstersDefeated || 0,
        lastActive: Date.now()
    };
}

function userExists(jid) {
    const main = loadJSON(MAIN_PATH);
    return !!main[jid];
}

// ========== دوال مساعدة ==========
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
    return user;
}

function calculateStats(level, soldiers, weapons, accessories) {
    soldiers = soldiers || {};
    weapons = weapons || {};
    accessories = accessories || {};
    let baseHealth = 100 + (level - 1) * 20;
    let baseAttack = 10 + (level - 1) * 5;
    let baseDefense = 5 + (level - 1) * 3;
    let totalAttack = baseAttack
        + (soldiers.normal || 0) * 2 + (soldiers.knight || 0) * 5
        + (soldiers.archer || 0) * 4 + (soldiers.eliteGuard || 0) * 8
        + (soldiers.dragonSpearman || 0) * 15 + (soldiers.legendaryCommander || 0) * 30
        + (weapons.ironSword || 0) * 10 + (weapons.legendaryBow || 0) * 20
        + (weapons.lightningSword || 0) * 40 + (weapons.giantHammer || 0) * 60
        + (weapons.deathBow || 0) * 80 + (weapons.destructionAxe || 0) * 100
        + (weapons.heroSword || 0) * 50 + (weapons.timeBow || 0) * 70
        + (weapons.eternalBlade || 0) * 120
        + (accessories.powerRing || 0) * 10 + (accessories.kingsCrown || 0) * 30
        + (accessories.heroMask || 0) * 20;
    let totalDefense = baseDefense
        + (soldiers.knight || 0) * 2 + (soldiers.eliteGuard || 0) * 4
        + (soldiers.dragonSpearman || 0) * 8 + (soldiers.legendaryCommander || 0) * 15
        + (weapons.goldenShield || 0) * 15 + (weapons.fireShield || 0) * 40
        + (weapons.godShield || 0) * 80
        + (accessories.protectionRing || 0) * 10 + (accessories.kingsCrown || 0) * 30
        + (accessories.shadowMask || 0) * 15 + (accessories.heroMask || 0) * 20;
    return { health: baseHealth, attack: totalAttack, defense: totalDefense };
}

function calculatePower(user) {
    const stats = calculateStats(user.level, user.soldiers, user.weapons, user.accessories);
    const soldierWeights = { normal: 1, knight: 3, archer: 2, eliteGuard: 5, dragonSpearman: 10, legendaryCommander: 20 };
    const weaponWeights = { ironSword: 2, goldenShield: 3, legendaryBow: 5, lightningSword: 8, giantHammer: 10, deathBow: 15, destructionAxe: 20, heroSword: 12, timeBow: 18, eternalBlade: 25, fireShield: 8, godShield: 18 };
    const accessoryWeights = { powerRing: 2, protectionRing: 2, kingsCrown: 8, shadowMask: 4, heroMask: 5 };
    let soldierPower = 0;
    for (const [type, count] of Object.entries(user.soldiers || {})) soldierPower += (soldierWeights[type] || 0) * count;
    let weaponPower = 0;
    for (const [type, count] of Object.entries(user.weapons || {})) weaponPower += (weaponWeights[type] || 0) * count;
    let accessoryPower = 0;
    for (const [type, count] of Object.entries(user.accessories || {})) accessoryPower += (accessoryWeights[type] || 0) * count;
    return Math.round(stats.health + stats.attack * 2 + stats.defense * 1.5 + user.level * 100 + user.prosperity * 50 + user.lands * 30 + soldierPower * 5 + weaponPower * 3 + accessoryPower * 2);
}

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🔍 بــحــث عــن مـمـلـكـة 🔍\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: 'بحث',
    description: '🔍 البحث عن مملكة بالاسم وعرض تصنيفها',
    category: 'مملكة',
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const body = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
        const args = body.split(/\s+/).slice(1);
        const searchName = args.join(' ');

        if (!searchName) {
            await sendMessage(sock, chatId, [
                '❌ اكتب اسم المملكة بعد الأمر.',
                '📌 مثال: .بحث مملكة النور'
            ], msg);
            return;
        }

        // ===== تحميل البيانات من النظام المنفصل =====
        const mainData = loadJSON(MAIN_PATH);
        const entries = Object.entries(mainData);

        if (entries.length === 0) {
            await sendMessage(sock, chatId, [
                '📊 لا توجد مملكات مسجلة.'
            ], msg);
            return;
        }

        // ===== البحث عن مملكة تطابق الاسم =====
        const results = entries.filter(([jid, main]) => {
            const name = main.name || `مملكة @${jid.split('@')[0]}`;
            return name.toLowerCase().includes(searchName.toLowerCase());
        });

        if (results.length === 0) {
            await sendMessage(sock, chatId, [
                `❌ لا توجد مملكة باسم "${searchName}"`
            ], msg);
            return;
        }

        // ===== حساب القوة والترتيب لكل نتيجة =====
        const ranked = results.map(([jid, main]) => {
            const user = loadUserData(jid);
            const power = calculatePower(user);
            return { jid, user, power };
        });
        ranked.sort((a, b) => b.power - a.power);

        // ===== حساب الترتيب العالمي لكل مملكة =====
        const all = entries.map(([jid, main]) => {
            const user = loadUserData(jid);
            return { jid, power: calculatePower(user) };
        });
        all.sort((a, b) => b.power - a.power);

        const lines = [`🔍 *نتائج البحث عن: "${searchName}"*`, ''];
        const mentions = [];

        ranked.forEach((item, index) => {
            const globalRank = all.findIndex(x => x.jid === item.jid) + 1;
            const stats = calculateStats(item.user.level, item.user.soldiers, item.user.weapons, item.user.accessories);
            const name = item.user.name || `مملكة @${item.jid.split('@')[0]}`;
            const medal = index === 0 ? '🥇' : `${index + 1}.`;
            const userNumber = item.jid.split('@')[0];

            lines.push(`${medal} ${name}`);
            lines.push(`   👤 @${userNumber}`);
            lines.push(`   📊 الترتيب العالمي: #${globalRank}`);
            lines.push(`   💪 القوة: ${item.power.toLocaleString()}`);
            lines.push(`   ❤️ HP: ${stats.health} | ⚔️ هجوم: ${stats.attack} | 🛡️ دفاع: ${stats.defense}`);
            lines.push(`   ✨ المستوى: ${item.user.level} | 🏆 انتصارات: ${item.user.pvpWins || 0}`);
            lines.push('');
            mentions.push(item.jid);
        });

        await sendMessage(sock, chatId, lines, msg, mentions);
    }
};