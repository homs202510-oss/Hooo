// دخل.js - تحصيل الدخل اليومي (مع دعم الفرق/التحالفات، بدون حد أقصى) - نسخة متوافقة مع نظام التخزين المنفصل
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const questPath = path.join(__dirname, 'db-quests.json');
const teamsPath = path.join(__dirname, 'db-teams.json');

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
if (!fs.existsSync(teamsPath)) fs.writeFileSync(teamsPath, JSON.stringify({}, null, 2));

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
        buildings: buildings,
        monstersDefeated: stats.monstersDefeated || 0,
        pvpWins: stats.pvpWins || 0,
        pvpLosses: stats.pvpLosses || 0,
        lastDaily: active.lastDaily || 0,
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
    resources[jid] = data.resources || { wood: 0, stone: 0, iron: 0 };
    saveJSON(RESOURCES_PATH, resources);

    const buildings = loadJSON(BUILDINGS_PATH);
    buildings[jid] = data.buildings || {};
    saveJSON(BUILDINGS_PATH, buildings);

    const stats = loadJSON(STATS_PATH);
    stats[jid] = {
        pvpWins: data.pvpWins || 0,
        pvpLosses: data.pvpLosses || 0,
        monstersDefeated: data.monstersDefeated || 0
    };
    saveJSON(STATS_PATH, stats);

    const active = loadJSON(ACTIVE_PATH);
    active[jid] = {
        lastDaily: data.lastDaily || 0,
        lastActive: data.lastActive || Date.now(),
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
        upgradeCountSinceRest: data.upgradeCountSinceRest || 0
    };
    saveJSON(ACTIVE_PATH, active);
}

function userExists(jid) {
    const main = loadJSON(MAIN_PATH);
    return !!main[jid];
}

// ========== دوال الفرق ==========
function loadTeams() { return loadJSON(teamsPath); }
function isPlayerInTeam(jid, teams) {
    for (const [teamName, teamData] of Object.entries(teams)) {
        if (teamData.leader === jid || (teamData.members && teamData.members.includes(jid))) {
            return teamName;
        }
    }
    return null;
}
function getTeam(teamName, teams) { return teams[teamName] || null; }

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `💰 الـدخـل الـيـومـي 💰\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== دالة تصحيح بيانات المستخدم (كاملة) ==========
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
    // حقول الأنظمة الأخرى (للتأكد من وجودها)
    if (user.upgradeCountToday === undefined || user.upgradeCountToday === null) user.upgradeCountToday = 0;
    if (user.lastUpgradeReset === undefined || user.lastUpgradeReset === null) user.lastUpgradeReset = 0;
    if (user.upgradeRestStage === undefined || user.upgradeRestStage === null) user.upgradeRestStage = 0;
    if (user.upgradeRestStartTime === undefined || user.upgradeRestStartTime === null) user.upgradeRestStartTime = 0;
    if (user.upgradeCountSinceRest === undefined || user.upgradeCountSinceRest === null) user.upgradeCountSinceRest = 0;
    if (user.lastDaily === undefined || user.lastDaily === null) user.lastDaily = 0;
    if (user.lastAttack === undefined || user.lastAttack === null) user.lastAttack = 0;
    if (user.attacksToday === undefined || user.attacksToday === null) user.attacksToday = 0;
    if (user.lastAttackReset === undefined || user.lastAttackReset === null) user.lastAttackReset = 0;
    if (user.attackRestStage === undefined || user.attackRestStage === null) user.attackRestStage = 0;
    if (user.attackRestStartTime === undefined || user.attackRestStartTime === null) user.attackRestStartTime = 0;
    if (user.attackCountSinceRest === undefined || user.attackCountSinceRest === null) user.attackCountSinceRest = 0;
    if (user.lastMonsterFight === undefined || user.lastMonsterFight === null) user.lastMonsterFight = 0;
    if (user.monsterFightCount === undefined || user.monsterFightCount === null) user.monsterFightCount = 0;
    if (user.restStage === undefined || user.restStage === null) user.restStage = 0;
    if (user.restStartTime === undefined || user.restStartTime === null) user.restStartTime = 0;
    // تحديث وقت النشاط
    user.lastActive = Date.now();
    return user;
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: 'دخل',
    description: '💰 تحصيل الدخل اليومي (حسب مستوى المملكة ومستوى الفريق إن وجد، بدون حد أقصى)',
    category: 'مملكة',
    usage: '.دخل',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            const points = loadJSON(pointsPath);
            const teams = loadTeams();

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

            // ===== التحقق من التبريد اليومي =====
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            if (user.lastDaily && (now - user.lastDaily) < oneDay) {
                const remaining = oneDay - (now - user.lastDaily);
                const hoursLeft = Math.ceil(remaining / (60 * 60 * 1000));
                const minutesLeft = Math.ceil(remaining / (60 * 1000));

                await sendMessage(sock, chatId, [
                    `⏳ يمكنك تحصيل دخلك اليومي بعد ${hoursLeft} ساعة`,
                    `⏳ أو ${minutesLeft} دقيقة`,
                    '',
                    '📌 عد غداً للحصول على دخلك'
                ], msg, [sender]);
                return;
            }

            // ===== حساب الدخل =====
            // 1. الدخل الأساسي من مستوى المملكة
            const baseIncome = 50;
            const levelBonus = user.level * 5;
            const prosperityBonus = Math.floor(user.prosperity / 5);
            const landsBonus = Math.floor(user.lands / 2);

            let totalIncome = baseIncome + levelBonus + prosperityBonus + landsBonus;
            
            // 2. دخل إضافي من الفريق (التحالف)
            let teamBonus = 0;
            let teamName = null;
            let teamMembersCount = 0;
            let totalTeamLevels = 0;
            let teamLevelBonus = 0;
            
            const playerTeam = isPlayerInTeam(sender, teams);
            if (playerTeam) {
                const team = getTeam(playerTeam, teams);
                if (team) {
                    teamName = playerTeam;
                    const allMembers = [team.leader, ...(team.members || [])];
                    teamMembersCount = allMembers.length;
                    
                    // حساب مجموع مستويات أعضاء الفريق
                    for (const member of allMembers) {
                        const memberData = loadUserData(member);
                        if (memberData) {
                            totalTeamLevels += (memberData.level || 1);
                        }
                    }
                    
                    // حساب متوسط مستوى الفريق
                    const averageTeamLevel = Math.floor(totalTeamLevels / teamMembersCount);
                    
                    // مكافأة الفريق: 5 نقاط × متوسط مستوى الفريق
                    teamLevelBonus = averageTeamLevel * 5;
                    
                    // إضافة مكافأة إضافية حسب عدد الأعضاء
                    const memberBonus = teamMembersCount * 2;
                    
                    teamBonus = teamLevelBonus + memberBonus;
                    totalIncome += teamBonus;
                }
            }

            // ===== الموارد (تزيد مع مستوى الفريق) =====
            const baseWood = 10 + (user.buildings.lumberMill?.level || 0) * 5;
            const baseStone = 5 + (user.buildings.quarry?.level || 0) * 3;
            const baseIron = 3 + (user.buildings.ironMine?.level || 0) * 2;

            // زيادة الموارد إذا كان في فريق
            const teamResourceBonus = teamName ? 1.2 : 1; // +20% موارد للفرق
            const woodIncome = Math.floor(baseWood * teamResourceBonus);
            const stoneIncome = Math.floor(baseStone * teamResourceBonus);
            const ironIncome = Math.floor(baseIron * teamResourceBonus);

            // ===== تحديث البيانات =====
            points[sender] = (points[sender] || 0) + totalIncome;
            user.resources.wood = (user.resources.wood || 0) + woodIncome;
            user.resources.stone = (user.resources.stone || 0) + stoneIncome;
            user.resources.iron = (user.resources.iron || 0) + ironIncome;
            user.lastDaily = now;
            user.prosperity = (user.prosperity || 0) + 2;
            user.lands = (user.lands || 0) + Math.floor(totalIncome / 100);
            user.lastActive = now;

            saveUserData(sender, user);
            saveJSON(pointsPath, points);

            // ===== تحديث المهام =====
            let questData = loadJSON(questPath);
            if (questData[sender]) {
                questData[sender].progress = questData[sender].progress || {};
                questData[sender].progress.daily = (questData[sender].progress.daily || 0) + 1;
                saveJSON(questPath, questData);
            }

            // ===== بناء الرسالة =====
            const lines = [
                `👑 @${sender.split('@')[0]}`,
                '',
                `💰 الدخل اليومي: ${totalIncome} نقطة`,
                ...(teamName ? [`🏴 *مكافأة الفريق (${teamName}):* +${teamBonus} نقطة`] : []),
                `🪵 خشب +${woodIncome}`,
                `🪨 حجر +${stoneIncome}`,
                `⛏️ حديد +${ironIncome}`,
                `📈 ازدهار +2 (الإجمالي: ${user.prosperity})`,
                `🗺️ أراضي +${Math.floor(totalIncome / 100)} (الإجمالي: ${user.lands})`,
                `💎 رصيدك: ${points[sender]} نقطة`,
                ...(teamName ? [`🏴 فريقك: ${teamName} (${teamMembersCount} عضو)`] : []),
                '',
                '📌 عد غداً لدخل جديد'
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر دخل:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تحصيل الدخل.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};