// فريقي.js - عرض معلومات فريقك (الأعضاء، القائد، القوة، تاريخ الإنشاء) - نسخة متوافقة مع نظام التخزين المنفصل
const fs = require('fs');
const path = require('path');

const teamsPath = path.join(__dirname, 'db-teams.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const SOLDIERS_PATH = path.join(dataDir, 'kd-soldiers.json');
const WEAPONS_PATH = path.join(dataDir, 'kd-weapons.json');
const ACCESSORIES_PATH = path.join(dataDir, 'kd-accessories.json');
const STATS_PATH = path.join(dataDir, 'kd-stats.json');
const ACTIVE_PATH = path.join(dataDir, 'kd-active.json');

// ===== التأكد من وجود جميع الملفات =====
const allPaths = [MAIN_PATH, SOLDIERS_PATH, WEAPONS_PATH, ACCESSORIES_PATH, STATS_PATH, ACTIVE_PATH];
for (const p of allPaths) {
    if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(teamsPath)) fs.writeFileSync(teamsPath, JSON.stringify({}, null, 2));

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; }
}
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

// ========== دوال الفرق ==========
function loadTeams() { return loadJSON(teamsPath); }
function saveTeams(data) { saveJSON(teamsPath, data); }

function getTeamNameByMember(jid, teams) {
    for (const [teamName, teamData] of Object.entries(teams)) {
        if (teamData.leader === jid || (teamData.members && teamData.members.includes(jid))) {
            return teamName;
        }
    }
    return null;
}

function getTeam(teamName, teams) {
    return teams[teamName] || null;
}

// ========== دالة تصحيح بيانات المستخدم ==========
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
    if (!user.companion) user.companion = null;
    if (!user.owner) user.owner = user.owner || null;
    if (!user.spellsUsed) user.spellsUsed = {};
    user.lastActive = Date.now();
    return user;
}

// ========== دالة حساب قوة اللاعب (لحساب قوة الفريق) ==========
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
    return Math.round(stats.attack + stats.defense);
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `🏴 مـعـلـومـات الـفـريـق 🏴\n`;
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
    command: ['فريقي', 'تحالفنا'],
    description: '🏴 عرض معلومات فريقك (الأعضاء، القائد، القوة، تاريخ الإنشاء)',
    category: 'مملكة',
    usage: '.فريقي',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            // تحميل البيانات
            const teams = loadTeams();

            // ===== التحقق من وجود مملكة للمستخدم =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                    `📌 استخدم .لاعب جديد لتأسيس مملكتك.`
                ], msg, [sender]);
                return;
            }

            // تحديث بيانات المستخدم
            let user = loadUserData(sender);
            user = sanitizeUser(user);
            saveUserData(sender, user);

            // ===== التحقق من أن المستخدم في فريق =====
            const teamName = getTeamNameByMember(sender, teams);
            if (!teamName) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، أنت لست في أي فريق.`,
                    ``,
                    `📌 استخدم .فريق جديد لإنشاء فريق.`,
                    `📌 أو استخدم .انضمام [اسم الفريق] لطلب الانضمام.`
                ], msg, [sender]);
                return;
            }

            const teamData = getTeam(teamName, teams);
            if (!teamData) {
                await sendMessage(sock, chatId, [
                    `❌ حدث خطأ: الفريق غير موجود.`
                ], msg, [sender]);
                return;
            }

            // ===== جمع معلومات الفريق =====
            const isLeader = teamData.leader === sender;
            const allMembers = [teamData.leader, ...(teamData.members || [])];
            const membersCount = allMembers.length;

            // حساب قوة الفريق (مجموع قوى الأعضاء)
            let totalPower = 0;
            const membersList = [];
            const mentions = [];

            for (const memberJid of allMembers) {
                let memberUser = loadUserData(memberJid);
                if (!memberUser) {
                    memberUser = { level: 1, soldiers: {}, weapons: {}, accessories: {} };
                } else {
                    memberUser = sanitizeUser(memberUser);
                }
                const power = calculatePower(memberUser);
                totalPower += power;

                const memberName = memberUser.name || `@${memberJid.split('@')[0]}`;
                const isLeaderText = memberJid === teamData.leader ? '👑' : '';
                membersList.push(`${isLeaderText} ${memberName}`);
                mentions.push(memberJid);
            }

            // تاريخ الإنشاء
            const createdAt = teamData.createdAt ? new Date(teamData.createdAt).toLocaleString() : 'غير معروف';

            // ===== بناء الرسالة =====
            const lines = [
                `🏴 *${teamName}*`,
                '',
                `👑 القائد: @${teamData.leader.split('@')[0]}`,
                `👥 عدد الأعضاء: ${membersCount}`,
                `💪 قوة الفريق: ${totalPower}`,
                `📅 تاريخ الإنشاء: ${createdAt}`,
                '',
                `📋 *قائمة الأعضاء:*`
            ];

            for (let i = 0; i < membersList.length; i++) {
                const member = membersList[i];
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
                lines.push(`   ${medal} ${member}`);
            }

            if (isLeader) {
                lines.push('');
                lines.push('📌 *أنت قائد الفريق.*');
                lines.push('   • استخدم `.دعوة @منشن` لدعوة أعضاء جدد.');
                lines.push('   • استخدم `.خروج @منشن` لطرد عضو.');
                lines.push('   • استخدم `.خروج` لحذف الفريق (مع تأكيد).');
            } else {
                lines.push('');
                lines.push('📌 *أنت عضو في الفريق.*');
                lines.push('   • استخدم `.خروج` لطلب الخروج من الفريق (القائد يوافق/يرفض).');
            }

            await sendMessage(sock, chatId, lines, msg, mentions);

        } catch (error) {
            console.error('✗ خطأ في أمر فريقي:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء عرض معلومات الفريق.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};