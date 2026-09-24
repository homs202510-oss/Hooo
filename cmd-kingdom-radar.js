// رادار.js - عرض جميع الممالك مرتبة حسب القوة (مع النقاط والمستوى المخفيين)
const fs = require('fs');
const path = require('path');
const { isFounder, isOwnerbot, isDeveloper, toLid } = require('./lib-roles');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const SOLDIERS_PATH = path.join(dataDir, 'kd-soldiers.json');
const WEAPONS_PATH = path.join(dataDir, 'kd-weapons.json');
const ACCESSORIES_PATH = path.join(dataDir, 'kd-accessories.json');
const STATS_PATH = path.join(dataDir, 'kd-stats.json');
const POINTS_PATH = path.join(__dirname, 'db-points.json');
const HIDDEN_PATH = path.join(__dirname, 'db-hidden-points.json');

// ===== التأكد من وجود الملفات =====
const allPaths = [MAIN_PATH, SOLDIERS_PATH, WEAPONS_PATH, ACCESSORIES_PATH, STATS_PATH, POINTS_PATH, HIDDEN_PATH];
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
        console.error('❌ فشل حفظ:', file, e.message);
        return false;
    }
}

// ========== نظام الإخفاء ==========
function getHiddenList() {
    try {
        if (fs.existsSync(HIDDEN_PATH)) {
            return JSON.parse(fs.readFileSync(HIDDEN_PATH));
        }
    } catch {}
    return [];
}

function isHiddenUser(jid) {
    try {
        const lid = toLid(jid);
        if (isFounder(lid) || isOwnerbot(lid) || isDeveloper(lid)) {
            return true;
        }
    } catch {}
    const hidden = getHiddenList();
    return hidden.includes(jid);
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
        monstersDefeated: stats.monstersDefeated || 0
    };
}

function userExists(jid) {
    const main = loadJSON(MAIN_PATH);
    return !!main[jid];
}

// ========== حساب القوة ==========
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

// ========== تنسيق النقاط ==========
function formatPoints(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    num = Math.floor(num);
    if (num >= 1e15) return '∞';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + ' تريليون';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + ' مليار';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + ' مليون';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + ' ألف';
    return num.toString();
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `📡 رادار الـمـمـالـك 📡\n`;
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
    command: ['رادار'],
    description: '📡 عرض جميع الممالك مرتبة حسب القوة (مع النقاط والمستوى المخفيين)',
    category: 'مملكة',
    usage: '.رادار',
    example: '.رادار',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            // ===== التحقق من مستوى المستخدم =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                    '📌 استخدم .لاعب جديد لتأسيس مملكتك.'
                ], msg, [sender]);
                return;
            }

            const userData = loadUserData(sender);
            if (userData.level < 100) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، تحتاج إلى مستوى 100 لاستخدام الرادار.`,
                    `📌 مستواك الحالي: ${userData.level}`,
                    `📈 استخدم .تطور لرفع المستوى.`
                ], msg, [sender]);
                return;
            }

            // ===== تحميل جميع الممالك =====
            const mainData = loadJSON(MAIN_PATH);
            const pointsData = loadJSON(POINTS_PATH);
            const entries = Object.entries(mainData);

            if (entries.length === 0) {
                await sendMessage(sock, chatId, [
                    '📡 لا توجد مملكات مسجلة بعد.',
                    '',
                    '📌 كن أول من يؤسس مملكة بـ .لاعب جديد'
                ], msg);
                return;
            }

            // ===== حساب القوة والنقاط لكل مملكة =====
            const ranked = entries.map(([jid, main]) => {
                const user = loadUserData(jid);
                const power = calculatePower(user);
                const points = pointsData[jid] || 0;
                const hidden = isHiddenUser(jid);
                return { jid, user, power, points, hidden };
            });

            // ===== ترتيب تنازلي =====
            ranked.sort((a, b) => b.power - a.power);

            // ===== بناء الرسالة (جميع الممالك في رسالة واحدة) =====
            const lines = [
                `📡 *رادار الممالك*`,
                `📊 إجمالي الممالك: ${ranked.length}`,
                `━━━━━━━━━━━━━━━━━━━━`
            ];

            const mentions = [];

            for (let i = 0; i < ranked.length; i++) {
                const item = ranked[i];
                const rank = i + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                const name = item.user.name || `مملكة @${item.jid.split('@')[0]}`;
                const pointsDisplay = item.hidden ? '🔒 مخفي' : formatPoints(item.points);
                const levelDisplay = item.hidden ? '🔒 مخفي' : item.user.level.toString();
                
                lines.push(`${medal} ${name}`);
                lines.push(`   💪 القوة: ${item.power.toLocaleString()}`);
                lines.push(`   💰 النقاط: ${pointsDisplay}`);
                lines.push(`   📈 المستوى: ${levelDisplay}`);
                lines.push('');
                mentions.push(item.jid);
            }

            lines.push(`📌 *ملاحظة:* 🔒 النقاط والمستوى المخفيين في وضع الحماية.`);

            await sendMessage(sock, chatId, lines, msg, mentions);

        } catch (error) {
            console.error('✗ خطأ في أمر رادار:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء عرض الرادار.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};