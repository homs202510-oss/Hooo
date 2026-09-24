// انشاء فريق.js - إنشاء فريق جديد (يشترط مستوى القائد 1000+) - نسخة متوافقة مع نظام التخزين المنفصل
const fs = require('fs');
const path = require('path');

const teamsPath = path.join(__dirname, 'db-teams.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const ACTIVE_PATH = path.join(dataDir, 'kd-active.json');

// ===== التأكد من وجود جميع الملفات =====
if (!fs.existsSync(MAIN_PATH)) fs.writeFileSync(MAIN_PATH, JSON.stringify({}, null, 2));
if (!fs.existsSync(ACTIVE_PATH)) fs.writeFileSync(ACTIVE_PATH, JSON.stringify({}, null, 2));
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
    const active = loadJSON(ACTIVE_PATH)[jid] || {};

    return {
        level: main.level || 1,
        prosperity: main.prosperity || 0,
        lands: main.lands || 0,
        gold: main.gold || 0,
        name: main.name || `مملكة @${jid.split('@')[0]}`,
        owner: main.owner || jid,
        nameChangesUsed: main.nameChangesUsed || 0,
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

function isPlayerInTeam(jid, teams) {
    for (const [teamName, teamData] of Object.entries(teams)) {
        if (teamData.leader === jid || (teamData.members && teamData.members.includes(jid))) {
            return teamName;
        }
    }
    return null;
}

function isTeamNameTaken(name, teams) {
    return !!teams[name];
}

// ========== دالة تصحيح بيانات المستخدم (شاملة) ==========
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
    user.lastActive = Date.now();
    return user;
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `🏴 إنـشـاء فـريـق 🏴\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['فريق', 'حلف'],
    description: '🏴 إنشاء فريق جديد (يشترط مستوى القائد 1000+)',
    category: 'مملكة',
    usage: '.فريق جديد [اسم الفريق]',
    example: '.فريق جديد قلب الأسد',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/);

            // التحقق من وجود وسيط 'جديد'
            if (args.length < 2 || args[1].toLowerCase() !== 'جديد') {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}`,
                    `📌 استخدم: .فريق جديد [اسم الفريق]`,
                    `📝 مثال: .فريق جديد قلب الأسد`,
                    '',
                    '📌 *شروط الإنشاء:*',
                    '• يجب أن يكون لديك مملكة.',
                    '• يجب أن يكون مستوى مملكتك 1000 أو أكثر.',
                    '• يجب ألا تكون منضمّاً لفريق آخر.',
                    '• يجب أن يكون اسم الفريق فريداً (غير مستخدم).'
                ], msg, [sender]);
                return;
            }

            // استخراج اسم الفريق (بعد 'جديد')
            const teamName = args.slice(2).join(' ').trim();
            if (!teamName) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، الرجاء كتابة اسم الفريق.`,
                    `📝 مثال: .فريق جديد قلب الأسد`
                ], msg, [sender]);
                return;
            }

            // التحقق من طول الاسم
            if (teamName.length < 3 || teamName.length > 30) {
                await sendMessage(sock, chatId, [
                    `❌ اسم الفريق يجب أن يكون بين 3 و 30 حرفاً.`,
                    `📌 حاول مرة أخرى.`
                ], msg, [sender]);
                return;
            }

            // تحميل البيانات
            const teams = loadTeams();

            // ===== التحقق من وجود مملكة للقائد =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                    `📌 استخدم .لاعب جديد لتأسيس مملكتك.`
                ], msg, [sender]);
                return;
            }

            let user = loadUserData(sender);
            user = sanitizeUser(user);
            saveUserData(sender, user);

            // ===== التحقق من مستوى القائد =====
            const REQUIRED_LEVEL = 1000;
            if (user.level < REQUIRED_LEVEL) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، مستوى مملكتك (${user.level}) لا يكفي لإنشاء فريق.`,
                    `📌 يجب أن يكون المستوى ${REQUIRED_LEVEL} أو أكثر.`,
                    `📈 استخدم .تطور لرفع المستوى.`
                ], msg, [sender]);
                return;
            }

            // ===== التحقق من أن القائد ليس في فريق بالفعل =====
            const existingTeam = isPlayerInTeam(sender, teams);
            if (existingTeam) {
                await sendMessage(sock, chatId, [
                    `⚠️ @${sender.split('@')[0]}، أنت بالفعل عضو في فريق "${existingTeam}".`,
                    `📌 لا يمكنك إنشاء فريق جديد وأنت في فريق.`,
                    `📌 استخدم .خروج للانسحاب من فريقك الحالي.`
                ], msg, [sender]);
                return;
            }

            // ===== التحقق من أن اسم الفريق غير مكرر =====
            if (isTeamNameTaken(teamName, teams)) {
                await sendMessage(sock, chatId, [
                    `❌ اسم الفريق "${teamName}" مستخدم بالفعل.`,
                    `📌 اختر اسماً آخر.`
                ], msg, [sender]);
                return;
            }

            // ===== إنشاء الفريق =====
            teams[teamName] = {
                leader: sender,
                members: [],
                createdAt: Date.now(),
                name: teamName
            };

            // حفظ الفريق
            saveTeams(teams);

            // تحديث وقت النشاط للقائد
            user.lastActive = Date.now();
            saveUserData(sender, user);

            // رسالة النجاح
            const lines = [
                `✅ @${sender.split('@')[0]}، تم إنشاء فريق *${teamName}* بنجاح!`,
                '',
                `👑 القائد: @${sender.split('@')[0]}`,
                `📅 تاريخ الإنشاء: ${new Date().toLocaleString()}`,
                `👥 عدد الأعضاء: 1 (أنت)`,
                '',
                '📌 *الأوامر المتاحة:*',
                '   • `.دعوة او .تحالف @منشن` – دعوة لاعب للانضمام.',
                '   • `.انضمام [اسم الفريق]` – طلب الانضمام لفريق.',
                '   • `.فريقي` – عرض معلومات فريقك.',
                '   • `.خروج` – طلب الخروج من الفريق (القائد يوافق/يرفض).',
                '   • `.خروج @منشن` – طرد عضو (للقائد فقط).'
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر فريق:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء إنشاء الفريق.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};