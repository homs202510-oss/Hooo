// تصنيفي.js - عرض ترتيب مملكتك فقط (مختصر) - نسخة متوافقة مع نظام التخزين المنفصل
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
const STATS_PATH = path.join(dataDir, 'kd-stats.json');

// ===== التأكد من وجود جميع الملفات =====
const allPaths = [MAIN_PATH, SOLDIERS_PATH, WEAPONS_PATH, ACCESSORIES_PATH, STATS_PATH];
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

// ========== حساب القوة (للترتيب فقط) ==========
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

function calculatePower(user) {
    const stats = calculateStats(user.level, user.soldiers || {}, user.weapons || {}, user.accessories || {});
    const soldierWeights = { normal: 1, knight: 3, archer: 2, eliteGuard: 5, dragonSpearman: 10, legendaryCommander: 20 };
    const weaponWeights = { ironSword: 2, goldenShield: 3, legendaryBow: 5, lightningSword: 8, giantHammer: 10, deathBow: 15, destructionAxe: 20, heroSword: 12, timeBow: 18, eternalBlade: 25, fireShield: 8, godShield: 18 };
    const accessoryWeights = { powerRing: 2, protectionRing: 2, kingsCrown: 8, shadowMask: 4, heroMask: 5 };

    let soldierPower = 0;
    for (const [type, count] of Object.entries(user.soldiers || {})) {
        soldierPower += (soldierWeights[type] || 0) * count;
    }
    let weaponPower = 0;
    for (const [type, count] of Object.entries(user.weapons || {})) {
        weaponPower += (weaponWeights[type] || 0) * count;
    }
    let accessoryPower = 0;
    for (const [type, count] of Object.entries(user.accessories || {})) {
        accessoryPower += (accessoryWeights[type] || 0) * count;
    }

    return Math.round(
        stats.health + 
        stats.attack * 2 + 
        stats.defense * 1.5 + 
        user.level * 100 + 
        (user.prosperity || 0) * 50 + 
        (user.lands || 0) * 30 + 
        soldierPower * 5 + 
        weaponPower * 3 + 
        accessoryPower * 2
    );
}

function getLevel(points) {
    if (points >= 10000) return '🦁 LEGEND';
    if (points >= 1000) return '💎 PRO';
    if (points >= 500) return '🔥 ADVANCED';
    if (points >= 200) return '🌱 JUNIOR';
    return '🙂 BEGINNER';
}

// ========== دالة ترتيب المستخدم ==========
function getUserRank(userJid) {
    const mainData = loadJSON(MAIN_PATH);
    const entries = Object.entries(mainData);
    if (entries.length === 0) return null;

    const ranked = entries.map(([jid, main]) => {
        const user = loadUserData(jid);
        const power = calculatePower(user);
        return { jid, user, power };
    });

    ranked.sort((a, b) => b.power - a.power);

    const userIndex = ranked.findIndex(item => item.jid === userJid);
    if (userIndex === -1) return null;

    return {
        rank: userIndex + 1,
        total: ranked.length,
        power: ranked[userIndex].power,
        user: ranked[userIndex].user
    };
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `👑 تـصـنـيـفـي 👑\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    
    await sock.sendMessage(chatId, { 
        text: msg, 
        mentions 
    }, { 
        quoted: quoted 
    });
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['تصنيفي'],
    description: '👑 عرض ترتيب مملكتك (الترتيب، النقاط، الرتبة، المستوى)',
    category: 'مملكة',
    usage: '.تصنيفي',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const senderNumber = sender.split('@')[0];

            const pointsData = loadJSON(pointsPath);

            // ===== التحقق من وجود مملكة =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    '❌ *ليس لديك مملكة*',
                    '',
                    '📌 لتأسيس مملكة استخدم الأمر:',
                    '`.لاعب جديد`',
                    '',
                    '🛡️ تأسيس مملكتك هو الخطوة الأولى للقوة!'
                ], msg);
                return;
            }

            // ===== جلب بيانات المستخدم =====
            let user = loadUserData(sender);
            const userPoints = pointsData[sender] || 0;
            const level = getLevel(userPoints);

            // ===== حساب الترتيب =====
            const rankInfo = getUserRank(sender);
            const rank = rankInfo ? rankInfo.rank : 'غير معروف';
            const totalKingdoms = rankInfo ? rankInfo.total : 0;
            const power = rankInfo ? rankInfo.power : 0;

            // ===== الميدالية =====
            let medal = '';
            if (rank === 1) medal = '🥇';
            else if (rank === 2) medal = '🥈';
            else if (rank === 3) medal = '🥉';

            // ===== اسم المملكة =====
            const kingdomName = user.name || `مملكة @${senderNumber}`;

            const lines = [
                `${medal} *${kingdomName}*`,
                '',
                `📊 *الترتيب:* #${rank} من ${totalKingdoms}`,
                `💪 *القوة:* ${power.toLocaleString()}`,
                `💰 *النقاط:* ${userPoints.toLocaleString()}`,
                `🏅 *الرتبة:* ${level}`,
                `📈 *المستوى:* ${user.level}`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر تصنيفي:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ *حدث خطأ أثناء عرض مملكتك*',
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};