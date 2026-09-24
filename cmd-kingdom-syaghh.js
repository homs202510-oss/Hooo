// صياغة.js - صناعة أسلحة ودروس وجرعات من الموارد (نسخة محدثة ومتوافقة مع نظام التخزين المنفصل)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

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
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🔨 الـصـيـاغـة 🔨\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== قائمة الوصفات ==========
const recipes = [
    // الأسلحة والدروع الأساسية
    { name: '🗡️ سيف خشبي', type: 'weapon', key: 'woodenSword', cost: { wood: 30, stone: 0, iron: 0 }, effect: 'هجوم +5', desc: 'سيف بدائي' },
    { name: '🛡️ درع حجري', type: 'weapon', key: 'stoneShield', cost: { wood: 0, stone: 25, iron: 0 }, effect: 'دفاع +5', desc: 'درع صلب' },
    { name: '⚔️ سيف حديدي', type: 'weapon', key: 'ironSword', cost: { wood: 20, stone: 15, iron: 10 }, effect: 'هجوم +12', desc: 'سيف حديدي' },
    { name: '🛡️ درع حديدي', type: 'weapon', key: 'ironShield', cost: { wood: 10, stone: 20, iron: 15 }, effect: 'دفاع +12', desc: 'درع حديدي' },
    { name: '🏹 قوس طويل', type: 'weapon', key: 'longBow', cost: { wood: 40, stone: 10, iron: 5 }, effect: 'هجوم +15', desc: 'قوس طويل' },
    { name: '⚔️ سيف فولاذي', type: 'weapon', key: 'steelSword', cost: { wood: 30, stone: 25, iron: 25 }, effect: 'هجوم +25', desc: 'سيف فولاذي' },
    { name: '🛡️ درع أسطوري', type: 'weapon', key: 'legendaryShield', cost: { wood: 50, stone: 50, iron: 40 }, effect: 'دفاع +35', desc: 'درع أسطوري' },
    // جرعات
    { name: '🧪 جرعة شفاء', type: 'potion', key: 'craftedHeal', cost: { wood: 10, stone: 5, iron: 5 }, effect: 'تستعيد 30 صحة', desc: 'جرعة شفاء' },
    // أسلحة متطورة
    { name: '⚡ سيف البرق', type: 'weapon', key: 'lightningSword', cost: { wood: 40, stone: 30, iron: 35 }, effect: 'هجوم +40', desc: 'سيف البرق' },
    { name: '🔨 مطرقة العمالقة', type: 'weapon', key: 'giantHammer', cost: { wood: 50, stone: 40, iron: 45 }, effect: 'هجوم +60', desc: 'مطرقة العمالقة' },
    { name: '🏹 قوس الموت', type: 'weapon', key: 'deathBow', cost: { wood: 60, stone: 30, iron: 50 }, effect: 'هجوم +80', desc: 'قوس الموت' },
    { name: '🪓 فأس الدمار', type: 'weapon', key: 'destructionAxe', cost: { wood: 70, stone: 50, iron: 60 }, effect: 'هجوم +100', desc: 'فأس الدمار' },
    // الدروع الخاصة (تمتص ضرر)
    { name: '🛡️ درع ذهبي', type: 'weapon', key: 'goldenShield', cost: { wood: 30, stone: 40, iron: 20 }, effect: 'دفاع +15، يمتص 15% ضرر', desc: 'درع ذهبي' },
    { name: '🔥 درع النار', type: 'weapon', key: 'fireShield', cost: { wood: 50, stone: 50, iron: 40 }, effect: 'دفاع +40، يمتص 25% ضرر', desc: 'درع النار' },
    { name: '✨ درع الملك', type: 'weapon', key: 'godShield', cost: { wood: 80, stone: 80, iron: 70 }, effect: 'دفاع +80، يمتص 40% ضرر', desc: 'درع الملك' }
];

module.exports = {
    command: 'صياغة',
    description: '🔨 صناعة أسلحة ودروس وجرعات من الموارد (متوافق مع نظام التخزين المنفصل)',
    category: 'مملكة',
    usage: '.صياغة [رقم الوصفة]',
    example: '.صياغة 1',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/);

            // عرض قائمة الوصفات
            if (args.length < 2) {
                const lines = [
                    '📖 *وصفات الصياغة*',
                    ''
                ];

                for (let i = 0; i < recipes.length; i++) {
                    const r = recipes[i];
                    lines.push(`${i+1}. ${r.name}`);
                    lines.push(`   🪵 ${r.cost.wood} | 🪨 ${r.cost.stone} | ⛏️ ${r.cost.iron}`);
                    lines.push(`   ✨ ${r.effect}`);
                    lines.push('');
                }

                lines.push('💡 للصياغة: .صياغة [رقم الوصفة]');
                lines.push('📝 مثال: .صياغة 1');

                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            const recipeIndex = parseInt(args[1]) - 1;
            if (isNaN(recipeIndex) || recipeIndex < 0 || recipeIndex >= recipes.length) {
                await sendMessage(sock, chatId, [
                    '❌ رقم الوصفة غير صحيح.',
                    '📌 استخدم .صياغة لعرض الوصفات'
                ], msg);
                return;
            }

            const recipe = recipes[recipeIndex];

            // ===== التحقق من وجود مملكة =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                    '📌 استخدم .لاعب جديد لتأسيس مملكتك.'
                ], msg, [sender]);
                return;
            }

            // ===== تحميل بيانات المستخدم =====
            let user = loadUserData(sender);
            user = sanitizeUser(user);

            if (!user.resources) user.resources = { wood: 0, stone: 0, iron: 0 };
            const { wood, stone, iron } = user.resources;

            // ===== التحقق من الموارد =====
            if (wood < recipe.cost.wood || stone < recipe.cost.stone || iron < recipe.cost.iron) {
                const lines = [
                    '❌ الموارد غير كافية!',
                    '',
                    `🪵 خشب ${recipe.cost.wood} (لديك ${wood})`,
                    `🪨 حجر ${recipe.cost.stone} (لديك ${stone})`,
                    `⛏️ حديد ${recipe.cost.iron} (لديك ${iron})`,
                    '',
                    '📌 احصل على الموارد من .دخل أو .وحش'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // ===== خصم الموارد =====
            user.resources.wood -= recipe.cost.wood;
            user.resources.stone -= recipe.cost.stone;
            user.resources.iron -= recipe.cost.iron;

            // ===== إضافة العنصر المصنوع =====
            if (recipe.type === 'weapon') {
                if (!user.weapons) user.weapons = {};
                user.weapons[recipe.key] = (user.weapons[recipe.key] || 0) + 1;
            } else if (recipe.type === 'potion') {
                if (!user.potions) user.potions = {};
                user.potions[recipe.key] = (user.potions[recipe.key] || 0) + 1;
            }

            // ===== تحديث وقت النشاط =====
            user.lastActive = Date.now();

     // ===== حفظ البيانات =====
            saveUserData(sender, user);

            const lines = [
                `🔨 @${sender.split('@')[0]} قمت بصياغة *${recipe.name}* بنجاح!`,
                '',
                `🪵 خشب -${recipe.cost.wood}`,
                `🪨 حجر -${recipe.cost.stone}`,
                `⛏️ حديد -${recipe.cost.iron}`,
                '',
                `✨ التأثير: ${recipe.effect}`,
                `📝 ${recipe.desc}`,
                '',
                `📊 خشب: ${user.resources.wood} | حجر: ${user.resources.stone} | حديد: ${user.resources.iron}`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر صياغة:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء الصياغة.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};