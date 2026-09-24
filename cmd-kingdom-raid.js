// غزو.js - غزو لاعب آخر وسرقة نقاطه وموارده (مع دعم الفرق والدروع والمعاهدات) - نسخة متوافقة مع نظام التخزين المنفصل
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const questPath = path.join(__dirname, 'db-quests.json');
const teamsPath = path.join(__dirname, 'db-teams.json');
const treatiesPath = path.join(__dirname, 'db-treaties.json');
const bankPath = path.join(__dirname, 'db-bank.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const RESOURCES_PATH = path.join(dataDir, 'kd-resources.json');
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
const allPaths = [MAIN_PATH, RESOURCES_PATH, SOLDIERS_PATH, WEAPONS_PATH, ACCESSORIES_PATH, POTIONS_PATH, SPELLS_PATH, STATS_PATH, ACTIVE_PATH, SOULBOOK_PATH, COMPANION_PATH];
for (const p of allPaths) {
    if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(questPath)) fs.writeFileSync(questPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(teamsPath)) fs.writeFileSync(teamsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(treatiesPath)) fs.writeFileSync(treatiesPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(bankPath)) fs.writeFileSync(bankPath, JSON.stringify({}, null, 2));

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); }
    catch { return {}; }
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
    const resources = loadJSON(RESOURCES_PATH)[jid] || {};
    const buildings = loadJSON(path.join(dataDir, 'kd-buildings.json'))[jid] || {};
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

    const buildings = loadJSON(path.join(dataDir, 'kd-buildings.json'));
    buildings[jid] = data.buildings || {};
    saveJSON(path.join(dataDir, 'kd-buildings.json'), buildings);

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

// ========== دوال المعاهدات ==========
function loadTreaties() { return loadJSON(treatiesPath); }
function saveTreaties(data) { saveJSON(treatiesPath, data); }

function getTreaty(jid1, jid2, treaties) {
    for (const [key, treaty] of Object.entries(treaties)) {
        if ((treaty.party1 === jid1 && treaty.party2 === jid2) ||
            (treaty.party1 === jid2 && treaty.party2 === jid1)) {
            return treaty;
        }
    }
    return null;
}

// ========== دالة نقل كل الممتلكات (عقوبة كسر المعاهدة) ==========
function transferAllAssets(loserJid, winnerJid) {
    const points = loadJSON(pointsPath);
    const bank = loadJSON(bankPath);

    const loser = loadUserData(loserJid);
    const winner = loadUserData(winnerJid);

    if (!loser || !winner) return { success: false, reason: 'أحد الطرفين ليس لديه مملكة' };

    // 1. نقل النقاط
    const loserPoints = points[loserJid] || 0;
    points[loserJid] = 0;
    points[winnerJid] = (points[winnerJid] || 0) + loserPoints;

    // 2. نقل رصيد البنك
    const loserBank = bank[loserJid] || { deposit: 0 };
    const loserDeposit = loserBank.deposit || 0;
    if (loserDeposit > 0) {
        bank[loserJid] = { deposit: 0, lastInterest: Date.now() };
        bank[winnerJid] = bank[winnerJid] || { deposit: 0, lastInterest: Date.now() };
        bank[winnerJid].deposit = (bank[winnerJid].deposit || 0) + loserDeposit;
    }

    // 3. نقل الموارد
    const resources = ['wood', 'stone', 'iron'];
    for (const res of resources) {
        const loserRes = loser.resources?.[res] || 0;
        if (loserRes > 0) {
            loser.resources[res] = 0;
            if (!winner.resources) winner.resources = { wood: 0, stone: 0, iron: 0 };
            winner.resources[res] = (winner.resources[res] || 0) + loserRes;
        }
    }

    // 4. نقل الأسلحة (بما فيها الدروع)
    const weaponKeys = ['ironSword', 'goldenShield', 'legendaryBow', 'lightningSword', 'giantHammer',
        'deathBow', 'destructionAxe', 'heroSword', 'timeBow', 'eternalBlade',
        'fireShield', 'godShield'];
    for (const key of weaponKeys) {
        const count = loser.weapons?.[key] || 0;
        if (count > 0) {
            loser.weapons[key] = 0;
            if (!winner.weapons) winner.weapons = {};
            winner.weapons[key] = (winner.weapons[key] || 0) + count;
        }
    }

    // 5. نقل الجنود
    const soldierKeys = ['normal', 'knight', 'archer', 'eliteGuard', 'dragonSpearman', 'legendaryCommander'];
    for (const key of soldierKeys) {
        const count = loser.soldiers?.[key] || 0;
        if (count > 0) {
            loser.soldiers[key] = 0;
            if (!winner.soldiers) winner.soldiers = {};
            winner.soldiers[key] = (winner.soldiers[key] || 0) + count;
        }
    }

    // 6. نقل الإكسسوارات
    const accessoryKeys = ['powerRing', 'protectionRing', 'kingsCrown', 'shadowMask', 'heroMask'];
    for (const key of accessoryKeys) {
        const count = loser.accessories?.[key] || 0;
        if (count > 0) {
            loser.accessories[key] = 0;
            if (!winner.accessories) winner.accessories = {};
            winner.accessories[key] = (winner.accessories[key] || 0) + count;
        }
    }

    // 7. نقل الجرعات
    const potionKeys = ['smallHeal', 'largeHeal', 'energyPotion', 'craftedHeal'];
    for (const key of potionKeys) {
        const count = loser.potions?.[key] || 0;
        if (count > 0) {
            loser.potions[key] = 0;
            if (!winner.potions) winner.potions = {};
            winner.potions[key] = (winner.potions[key] || 0) + count;
        }
    }

    // 8. نقل الرفيق
    if (loser.companion) {
        winner.companion = loser.companion;
        loser.companion = null;
    }

    // 9. نقل صفحات الروح والأرواح
    const loserPages = loser.soulBook?.pages || 0;
    const loserSpirits = loser.soulBook?.spirits || [];
    if (loserPages > 0 || loserSpirits.length > 0) {
        if (!winner.soulBook) winner.soulBook = { pages: 0, spirits: [] };
        winner.soulBook.pages = (winner.soulBook.pages || 0) + loserPages;
        winner.soulBook.spirits = [...(winner.soulBook.spirits || []), ...loserSpirits];
        loser.soulBook.pages = 0;
        loser.soulBook.spirits = [];
    }

    // حفظ التغييرات
    saveUserData(loserJid, loser);
    saveUserData(winnerJid, winner);
    saveJSON(pointsPath, points);
    saveJSON(bankPath, bank);

    return {
        success: true,
        transferred: {
            points: loserPoints,
            bank: loserDeposit,
            resources: { wood: loser.resources?.wood || 0, stone: loser.resources?.stone || 0, iron: loser.resources?.iron || 0 },
            weapons: weaponKeys.filter(k => loser.weapons?.[k] > 0).length,
            soldiers: soldierKeys.filter(k => loser.soldiers?.[k] > 0).length,
            accessories: accessoryKeys.filter(k => loser.accessories?.[k] > 0).length,
            potions: potionKeys.filter(k => loser.potions?.[k] > 0).length,
            companion: !!loser.companion,
            soulPages: loserPages
        }
    };
}

// ========== دوال الفرق ==========
function loadTeams() { return loadJSON(teamsPath); }
function saveTeams(data) { saveJSON(teamsPath, data); }
function isPlayerInTeam(jid, teams) {
    for (const [teamName, teamData] of Object.entries(teams)) {
        if (teamData.leader === jid || (teamData.members && teamData.members.includes(jid))) {
            return teamName;
        }
    }
    return null;
}
function getTeam(teamName, teams) { return teams[teamName] || null; }

// ===== حساب قوة الفريق =====
function calculateTeamPower(teamData) {
    let totalPower = 0;
    const allMembers = [teamData.leader, ...(teamData.members || [])];
    for (const member of allMembers) {
        const user = loadUserData(member);
        if (user) {
            const stats = calculateStats(user.level, user.soldiers, user.weapons, user.accessories);
            totalPower += stats.attack + stats.defense;
        }
    }
    return totalPower;
}

// ========== دوال الإحصائيات ==========
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

// ========== دوال الدروع ==========
const SHIELD_TYPES = {
    goldenShield: { name: '🛡️ درع ذهبي', defenseBonus: 15, durability: 3, absorbPercent: 0.15 },
    fireShield: { name: '🔥 درع النار', defenseBonus: 40, durability: 4, absorbPercent: 0.25 },
    godShield: { name: '✨ درع الآلهة', defenseBonus: 80, durability: 5, absorbPercent: 0.40 }
};

function calculateShieldProtection(user) {
    if (!user.weapons) return { totalAbsorb: 0, shieldsUsed: [] };
    let totalAbsorb = 0;
    let shieldsUsed = [];
    for (const [key, shieldInfo] of Object.entries(SHIELD_TYPES)) {
        const count = user.weapons[key] || 0;
        if (count > 0) {
            const used = Math.min(count, 1);
            if (used > 0) {
                totalAbsorb += shieldInfo.absorbPercent;
                shieldsUsed.push({ key, name: shieldInfo.name, count: used });
            }
        }
    }
    totalAbsorb = Math.min(totalAbsorb, 0.70);
    return { totalAbsorb, shieldsUsed };
}

function consumeShields(user, shieldsUsed) {
    if (!user.weapons) return;
    for (const shield of shieldsUsed) {
        const key = shield.key;
        const current = user.weapons[key] || 0;
        if (current > 0) {
            user.weapons[key] = current - 1;
        }
    }
}

// ========== نظام استراحة الغزو ==========
function checkAttackRest(user) {
    const now = Date.now();
    const stage = user.attackRestStage || 0;
    const startTime = user.attackRestStartTime || 0;
    const count = user.attackCountSinceRest || 0;

    if (stage === 1) {
        const elapsed = now - startTime;
        const restTime = 10 * 60 * 1000;
        if (elapsed >= restTime) {
            user.attackRestStage = 0;
            user.attackCountSinceRest = 0;
            user.attackRestStartTime = 0;
            return { canAttack: true, stage: 0, remaining: 0, changed: true };
        } else {
            return { canAttack: false, stage: 1, remaining: restTime - elapsed, changed: false };
        }
    }

    if (stage === 0) {
        if (count >= 5) {
            user.attackRestStage = 1;
            user.attackRestStartTime = now;
            return { canAttack: false, stage: 1, remaining: 10 * 60 * 1000, changed: true };
        }
        return { canAttack: true, stage: 0, remaining: 0, changed: false };
    }

    user.attackRestStage = 0;
    user.attackCountSinceRest = 0;
    user.attackRestStartTime = 0;
    return { canAttack: true, stage: 0, remaining: 0, changed: true };
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `⚔️ الـغـزو ⚔️\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== دوال استخراج المنشن ==========
function extractMentions(msg) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
    if (contextInfo.mentionedJid && contextInfo.mentionedJid.length > 0) {
        return contextInfo.mentionedJid;
    }
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const mentionMatch = text.match(/@(\d+)/);
    if (mentionMatch) {
        return [`${mentionMatch[1]}@s.whatsapp.net`];
    }
    if (contextInfo.participant) {
        return [contextInfo.participant];
    }
    return [];
}

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

// ========== الأمر الرئيسي ==========
module.exports = {
    command: 'غزو',
    description: '⚔️ غزو لاعب آخر وسرقة نقاطه وموارده (مع دعم الفرق والدروع والمعاهدات)',
    category: 'مملكة',
    usage: '.غزو @منشن (أو بالرد على رسالة)',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            // استخراج الهدف (منشن أو رد)
            const mentioned = extractMentions(msg);
            const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant || null;
            let target = null;

            if (mentioned.length > 0) {
                target = mentioned[0];
            } else if (quotedSender) {
                target = quotedSender;
            } else {
                await sendMessage(sock, chatId, [
                    `⚠️ @${sender.split('@')[0]}`,
                    `📌 استخدم: .غزو @منشن`,
                    `📝 مثال: .غزو @منشن`,
                    `📌 أو ارد على رسالة الشخص ثم .غزو`
                ], msg, [sender]);
                return;
            }

            if (!target.includes('@')) {
                target = `${target}@s.whatsapp.net`;
            }

            if (target === sender) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، لا يمكنك غزو نفسك!`
                ], msg, [sender]);
                return;
            }

            // ===== تحميل البيانات =====
            const points = loadJSON(pointsPath);
            const teams = loadTeams();
            const treaties = loadTreaties();

            // ===== التحقق من وجود مملكة للمهاجم والهدف =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                    '📌 استخدم .لاعب جديد لتأسيس مملكتك.'
                ], msg, [sender]);
                return;
            }
            if (!userExists(target)) {
                await sendMessage(sock, chatId, [
                    `❌ @${target.split('@')[0]}، ليس لديه مملكة.`,
                    '📌 يجب أن يكون لديه مملكة للغزو.'
                ], msg, [target]);
                return;
            }

            let attacker = loadUserData(sender);
            let defender = loadUserData(target);

            // ===== التحقق من وجود معاهدة =====
            const treaty = getTreaty(sender, target, treaties);
            if (treaty && treaty.status === 'accepted') {
                const breaker = sender;
                const victim = target;
                const transferResult = transferAllAssets(breaker, victim);
                delete treaties[treaty.id];
                saveTreaties(treaties);

                if (transferResult.success) {
                    await sendMessage(sock, chatId, [
                        `💥 *كسر المعاهدة!*`,
                        `⚠️ @${breaker.split('@')[0]} غزا @${victim.split('@')[0]} رغم وجود معاهدة سلام!`,
                        ``,
                        `⚖️ *العقوبة:* تم نقل *جميع* ممتلكات @${breaker.split('@')[0]} إلى @${victim.split('@')[0]}`,
                        `💰 نقاط: ${transferResult.transferred.points}`,
                        `🏦 وديعة البنك: ${transferResult.transferred.bank}`,
                        `🪵 خشب: ${transferResult.transferred.resources.wood} | 🪨 حجر: ${transferResult.transferred.resources.stone} | ⛏️ حديد: ${transferResult.transferred.resources.iron}`,
                        `⚔️ أسلحة: ${transferResult.transferred.weapons} نوع`,
                        `👥 جنود: ${transferResult.transferred.soldiers} نوع`,
                        `💍 إكسسوارات: ${transferResult.transferred.accessories} نوع`,
                        `🧪 جرعات: ${transferResult.transferred.potions} نوع`,
                        ...(transferResult.transferred.companion ? [`🐦 الرفيق: تم نقله`] : []),
                        `📖 صفحات روح: ${transferResult.transferred.soulPages}`,
                        ``,
                        `❌ تم إلغاء المعاهدة نهائياً.`,
                        `📌 @${breaker.split('@')[0]} أصبح بلا ممتلكات!`
                    ], msg, [breaker, victim]);
                    return;
                } else {
                    await sendMessage(sock, chatId, [
                        `❌ حدث خطأ أثناء تطبيق العقوبة.`,
                        `📌 حاول مرة أخرى.`
                    ], msg, [sender, target]);
                    return;
                }
            }

            // ===== نظام الفرق =====
            const attackerTeam = isPlayerInTeam(sender, teams);
            const defenderTeam = isPlayerInTeam(target, teams);

            // منع الغزو على أعضاء نفس الفريق
            if (attackerTeam && defenderTeam && attackerTeam === defenderTeam) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، لا يمكنك غزو عضو من فريقك (${attackerTeam})!`
                ], msg, [sender, target]);
                return;
            }

            // ===== حساب قوة المهاجم (فريقه بالكامل) =====
            let attackerPower = 0;
            let attackerTeamName = null;
            let attackerTeamData = null;
            let attackerTeamMembers = [];

            if (attackerTeam) {
                attackerTeamName = attackerTeam;
                attackerTeamData = getTeam(attackerTeam, teams);
                if (attackerTeamData) {
                    attackerPower = calculateTeamPower(attackerTeamData);
                    attackerTeamMembers = [attackerTeamData.leader, ...(attackerTeamData.members || [])];
                } else {
                    const stats = calculateStats(attacker.level, attacker.soldiers, attacker.weapons, attacker.accessories);
                    attackerPower = stats.attack + stats.defense;
                }
            } else {
                const stats = calculateStats(attacker.level, attacker.soldiers, attacker.weapons, attacker.accessories);
                attackerPower = stats.attack + stats.defense;
            }

            // ===== حساب قوة المدافع (فريقه بالكامل) =====
            let defenderPower = 0;
            let defenderTeamName = null;
            let defenderTeamData = null;
            let defenderTeamMembers = [];

            if (defenderTeam) {
                defenderTeamName = defenderTeam;
                defenderTeamData = getTeam(defenderTeam, teams);
                if (defenderTeamData) {
                    defenderPower = calculateTeamPower(defenderTeamData);
                    defenderTeamMembers = [defenderTeamData.leader, ...(defenderTeamData.members || [])];
                } else {
                    const stats = calculateStats(defender.level, defender.soldiers, defender.weapons, defender.accessories);
                    defenderPower = stats.attack + stats.defense;
                }
            } else {
                const stats = calculateStats(defender.level, defender.soldiers, defender.weapons, defender.accessories);
                defenderPower = stats.attack + stats.defense;
            }

            // ===== نظام المحاولات اليومية (15 غزوة) =====
            const MAX_ATTACKS_PER_DAY = 15;
            const now = Date.now();

            const today = new Date().toDateString();
            const lastReset = attacker.lastAttackReset ? new Date(attacker.lastAttackReset).toDateString() : null;

            if (lastReset !== today) {
                attacker.attacksToday = 0;
                attacker.lastAttackReset = now;
                saveUserData(sender, attacker);
            }

            if (attacker.attacksToday >= MAX_ATTACKS_PER_DAY) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، لقد استنفذت جميع محاولاتك اليومية (${MAX_ATTACKS_PER_DAY}/15).`,
                    `⏳ انتظر حتى منتصف الليل لتتمكن من الغزو مرة أخرى.`
                ], msg, [sender]);
                return;
            }

            // ===== نظام الاستراحة =====
            const restStatus = checkAttackRest(attacker);
            if (restStatus.changed) {
                saveUserData(sender, attacker);
            }

            if (!restStatus.canAttack) {
                const remainingTime = formatTime(restStatus.remaining);
                await sendMessage(sock, chatId, [
                    `⏳ *استرح قليلاً يا @${sender.split('@')[0]}*`,
                    ``,
                    `📌 استراحة 10 دقائق بعد 5 غزوات`,
                    `⏳ المتبقي: *${remainingTime}*`,
                    `📊 عدد الغزوات منذ آخر استراحة: ${attacker.attackCountSinceRest || 0}/5`,
                    ``,
                    `💡 عد بعد انتهاء الوقت`
                ], msg, [sender]);
                return;
            }

            // تحديث عدد الغزوات
            attacker.lastAttack = now;
            attacker.attacksToday = (attacker.attacksToday || 0) + 1;
            attacker.attackCountSinceRest = (attacker.attackCountSinceRest || 0) + 1;
            attacker.lastActive = now;
            saveUserData(sender, attacker);

            // ===== الدروع للمدافع =====
            const shieldInfo = calculateShieldProtection(defender);
            const absorbPercent = shieldInfo.totalAbsorb;

            // ===== تحديد الفائز =====
            let isAttackerWinner = false;
            if (attackerPower > defenderPower) {
                isAttackerWinner = Math.random() * 100 < 70;
            } else if (attackerPower < defenderPower) {
                isAttackerWinner = Math.random() * 100 < 30;
            } else {
                isAttackerWinner = Math.random() * 100 < 50;
            }

            let transferPoints = 0;
            let absorbedPoints = 0;
            const TRANSFER_PERCENT = 0.35;
            const MAX_TRANSFER_BASE = 1000;

            let messageLines = [];

            if (isAttackerWinner) {
                // ===== فوز المهاجم =====
                const loserPoints = points[target] || 0;
                transferPoints = Math.floor(loserPoints * TRANSFER_PERCENT);
                const maxTransfer = MAX_TRANSFER_BASE + (defender.level * 3);
                transferPoints = Math.min(transferPoints, maxTransfer);
                absorbedPoints = Math.floor(transferPoints * absorbPercent);
                transferPoints = transferPoints - absorbedPoints;

                // توزيع النقاط على المهاجم (فردي أو فريق)
                if (attackerTeam && attackerTeamData) {
                    const members = attackerTeamMembers;
                    const sharePerMember = Math.floor(transferPoints / members.length);
                    for (const member of members) {
                        points[member] = (points[member] || 0) + sharePerMember;
                    }
                    const remainder = transferPoints - (sharePerMember * members.length);
                    points[sender] = (points[sender] || 0) + remainder;
                } else {
                    points[sender] = (points[sender] || 0) + transferPoints;
                }

                // خصم من المدافع (فردي)
                points[target] = Math.max(0, loserPoints - transferPoints);

                // ===== سرقة الموارد (20% من كل مورد) =====
                const stolenWood = Math.floor((defender.resources?.wood || 0) * 0.2);
                const stolenStone = Math.floor((defender.resources?.stone || 0) * 0.2);
                const stolenIron = Math.floor((defender.resources?.iron || 0) * 0.2);

                if (!attacker.resources) attacker.resources = { wood: 0, stone: 0, iron: 0 };
                attacker.resources.wood = (attacker.resources.wood || 0) + stolenWood;
                attacker.resources.stone = (attacker.resources.stone || 0) + stolenStone;
                attacker.resources.iron = (attacker.resources.iron || 0) + stolenIron;

                if (defender.resources) {
                    defender.resources.wood = Math.max(0, (defender.resources.wood || 0) - stolenWood);
                    defender.resources.stone = Math.max(0, (defender.resources.stone || 0) - stolenStone);
                    defender.resources.iron = Math.max(0, (defender.resources.iron || 0) - stolenIron);
                }

                // تحديث الإحصائيات
                attacker.pvpWins = (attacker.pvpWins || 0) + 1;
                defender.pvpLosses = (defender.pvpLosses || 0) + 1;

                const levelUp = Math.floor(Math.random() * 5) + 1;
                attacker.level = (attacker.level || 0) + levelUp;

                // استهلاك الدروع
                if (shieldInfo.shieldsUsed.length > 0) {
                    consumeShields(defender, shieldInfo.shieldsUsed);
                }

                // تحديث المهام
                let questData = loadJSON(questPath);
                if (questData[sender]) {
                    if (!questData[sender].progress) questData[sender].progress = {};
                    questData[sender].progress.pvpWin = (questData[sender].progress.pvpWin || 0) + 1;
                    saveJSON(questPath, questData);
                }

                // حفظ التغييرات
                saveJSON(pointsPath, points);
                saveUserData(sender, attacker);
                saveUserData(target, defender);
                if (defenderTeam && defenderTeamData) saveTeams(teams);
                if (attackerTeam && attackerTeamData) saveTeams(teams);

                messageLines = [
                    `⚔️ *غزو ناجح!*`,
                    `👑 @${sender.split('@')[0]} غزا @${target.split('@')[0]}`,
                    `💥 قوة المهاجم: ${attackerPower}`,
                    `🛡️ قوة المدافع: ${defenderPower}`,
                    ...(defenderTeam ? [`🏴 *الفريق المدافع:* ${defenderTeam}`] : []),
                    ...(attackerTeam ? [`🏴 *الفريق المهاجم:* ${attackerTeam}`] : []),
                    `🛡️ *دروع المدافع:* ${absorbPercent > 0 ? `امتصت ${Math.round(absorbPercent*100)}% من الضرر` : 'لا يوجد'}`,
                    `🏆 *الفائز: @${sender.split('@')[0]}* ✅`,
                    `📈 ارتفع مستوى المهاجم بمقدار ${levelUp} (المستوى الآن ${attacker.level})`,
                    `💰 ${attackerTeam ? 'تم توزيع' : 'ربح'} ${transferPoints} نقطة!`,
                    ...(absorbPercent > 0 ? [`🛡️ تم امتصاص ${absorbedPoints} نقطة بواسطة الدروع`] : []),
                    `🪵 سرق ${stolenWood} خشب، ${stolenStone} حجر، ${stolenIron} حديد`,
                    `💔 @${target.split('@')[0]} خسر ${transferPoints} نقطة`,
                    `📊 انتصارات المهاجم: ${attacker.pvpWins} | هزائمه: ${attacker.pvpLosses}`,
                    `📊 متبقي اليوم: ${MAX_ATTACKS_PER_DAY - attacker.attacksToday} غزوة`,
                    `📊 غزوات حتى الاستراحة: ${attacker.attackCountSinceRest}/5`
                ];
            } else {
                // ===== فوز المدافع (خسارة المهاجم) =====
                const loserPoints = points[sender] || 0;
                transferPoints = Math.floor(loserPoints * TRANSFER_PERCENT);
                const maxTransfer = MAX_TRANSFER_BASE + (attacker.level * 3);
                transferPoints = Math.min(transferPoints, maxTransfer);

                // خصم من المهاجم (فردي أو فريق)
                if (attackerTeam && attackerTeamData) {
                    const members = attackerTeamMembers;
                    const sharePerMember = Math.floor(transferPoints / members.length);
                    for (const member of members) {
                        points[member] = Math.max(0, (points[member] || 0) - sharePerMember);
                    }
                    const remainder = transferPoints - (sharePerMember * members.length);
                    points[sender] = Math.max(0, (points[sender] || 0) - remainder);
                } else {
                    points[sender] = Math.max(0, loserPoints - transferPoints);
                }

                // مكافأة المدافع (فردي)
                points[target] = (points[target] || 0) + transferPoints;

                // المهاجم يخسر بعض الموارد (بدلاً من سرقتها)
                const lostWood = Math.floor((attacker.resources?.wood || 0) * 0.05);
                const lostStone = Math.floor((attacker.resources?.stone || 0) * 0.05);
                const lostIron = Math.floor((attacker.resources?.iron || 0) * 0.05);
                if (attacker.resources) {
                    attacker.resources.wood = Math.max(0, (attacker.resources.wood || 0) - lostWood);
                    attacker.resources.stone = Math.max(0, (attacker.resources.stone || 0) - lostStone);
                    attacker.resources.iron = Math.max(0, (attacker.resources.iron || 0) - lostIron);
                }

                // تحديث الإحصائيات
                attacker.pvpLosses = (attacker.pvpLosses || 0) + 1;
                defender.pvpWins = (defender.pvpWins || 0) + 1;

                const levelUp = Math.floor(Math.random() * 5) + 1;
                defender.level = (defender.level || 0) + levelUp;

                // حفظ التغييرات
                saveJSON(pointsPath, points);
                saveUserData(sender, attacker);
                saveUserData(target, defender);
                if (defenderTeam && defenderTeamData) saveTeams(teams);
                if (attackerTeam && attackerTeamData) saveTeams(teams);

                messageLines = [
                    `⚔️ *غزو فاشل!*`,
                    `👑 @${sender.split('@')[0]} حاول غزو @${target.split('@')[0]}`,
                    `💥 قوة المهاجم: ${attackerPower}`,
                    `🛡️ قوة المدافع: ${defenderPower}`,
                    ...(defenderTeam ? [`🏴 *الفريق المدافع:* ${defenderTeam}`] : []),
                    ...(attackerTeam ? [`🏴 *الفريق المهاجم:* ${attackerTeam}`] : []),
                    `🏆 *الفائز: @${target.split('@')[0]}* (دفاعاً) ✅`,
                    `📈 ارتفع مستوى المدافع بمقدار ${levelUp} (المستوى الآن ${defender.level})`,
                    `💰 @${target.split('@')[0]} ربح ${transferPoints} نقطة!`,
                    ...(attackerTeam && attackerTeamData ? [`📊 تم خصم النقاط من جميع أعضاء فريق @${sender.split('@')[0]}`] : []),
                    `🪵 خسر ${lostWood} خشب، ${lostStone} حجر، ${lostIron} حديد`,
                    `💔 @${sender.split('@')[0]} خسر ${transferPoints} نقطة`,
                    `📊 هزائم المهاجم: ${attacker.pvpLosses} | انتصارات المدافع: ${defender.pvpWins}`,
                    `📊 متبقي اليوم: ${MAX_ATTACKS_PER_DAY - attacker.attacksToday} غزوة`,
                    `📊 غزوات حتى الاستراحة: ${attacker.attackCountSinceRest}/5`
                ];
            }

            await sendMessage(sock, chatId, messageLines, msg, [sender, target]);

        } catch (error) {
            console.error('✗ خطأ في أمر غزو:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء الغزو.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};