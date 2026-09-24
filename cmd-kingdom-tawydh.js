// تعويذات.js - عرض وشراء التعاويذ (مرة يومياً، حد أسبوعي 15) - نسخة متوافقة مع نظام التخزين المنفصل
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const SPELLS_PATH = path.join(dataDir, 'kd-spells.json');
const ACTIVE_PATH = path.join(dataDir, 'kd-active.json');

// ===== التأكد من وجود جميع الملفات =====
const allPaths = [MAIN_PATH, SPELLS_PATH, ACTIVE_PATH];
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
    const spells = loadJSON(SPELLS_PATH)[jid] || {};
    const active = loadJSON(ACTIVE_PATH)[jid] || {};

    return {
        level: main.level || 1,
        prosperity: main.prosperity || 0,
        lands: main.lands || 0,
        gold: main.gold || 0,
        name: main.name || `مملكة @${jid.split('@')[0]}`,
        owner: main.owner || jid,
        nameChangesUsed: main.nameChangesUsed || 0,
        spellsUsed: spells,
        lastSpellReset: active.lastSpellReset || 0,
        totalSpellsUsedWeekly: active.totalSpellsUsedWeekly || 0,
        spellEffects: active.spellEffects || {},
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

    const spells = loadJSON(SPELLS_PATH);
    spells[jid] = data.spellsUsed || {};
    saveJSON(SPELLS_PATH, spells);

    const active = loadJSON(ACTIVE_PATH);
    active[jid] = {
        lastSpellReset: data.lastSpellReset || 0,
        totalSpellsUsedWeekly: data.totalSpellsUsedWeekly || 0,
        spellEffects: data.spellEffects || {},
        lastActive: data.lastActive || Date.now()
    };
    saveJSON(ACTIVE_PATH, active);
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
    if (user.spellsUsed.dragonFlame === undefined) user.spellsUsed.dragonFlame = 0;
    if (user.spellsUsed.kingsHeal === undefined) user.spellsUsed.kingsHeal = 0;
    if (user.spellsUsed.lightningStorm === undefined) user.spellsUsed.lightningStorm = 0;
    if (user.spellsUsed.ragingBull === undefined) user.spellsUsed.ragingBull = 0;
    if (user.spellsUsed.freeze === undefined) user.spellsUsed.freeze = 0;
    if (user.spellsUsed.cyclone === undefined) user.spellsUsed.cyclone = 0;
    if (user.spellsUsed.curse === undefined) user.spellsUsed.curse = 0;
    if (user.lastSpellReset === undefined || user.lastSpellReset === null) user.lastSpellReset = 0;
    if (user.totalSpellsUsedWeekly === undefined || user.totalSpellsUsedWeekly === null) user.totalSpellsUsedWeekly = 0;
    if (!user.spellEffects) user.spellEffects = {};
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

const spells = {
    'لهيب التنين': { 
        key: 'dragonFlame', 
        cost: 100, 
        effect: '🔥 +50 ضرر في المعركة القادمة',
        desc: 'يضيف 50 ضرر إضافي في هجومك القادم'
    },
    'شفاء الملك': { 
        key: 'kingsHeal', 
        cost: 90, 
        effect: '💖 +50 صحة مؤقتة',
        desc: 'يستعيد 50 نقطة صحة'
    },
    'عاصفة البرق': { 
        key: 'lightningStorm', 
        cost: 120, 
        effect: '⚡ ضربة أولى مضاعفة',
        desc: 'تضاعف قوة ضربتك الأولى في المعركة'
    },
    'الثور الهائج': { 
        key: 'ragingBull', 
        cost: 150, 
        effect: '🐂 +10% هجوم للمعركة',
        desc: 'يزيد هجومك بنسبة 10% في المعركة القادمة'
    },
    'تجمد': { 
        key: 'freeze', 
        cost: 130, 
        effect: '❄️ يشل العدو لجولة واحدة',
        desc: 'يشل حركة العدو في المعركة القادمة'
    },
    'إعصار': { 
        key: 'cyclone', 
        cost: 140, 
        effect: '🌪️ يقلل دفاع العدو 20%',
        desc: 'يقلل دفاع العدو بنسبة 20% في المعركة القادمة'
    },
    'لعنة الموت': { 
        key: 'curse', 
        cost: 200, 
        effect: '☠️ فرصة 50% لقتل العدو فوراً',
        desc: 'فرصة 50% لقتل العدو فوراً في المعركة القادمة'
    }
};

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    let msg = `🔮 التعاويذ 🔮\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: ['تعويذات', 'تعويذ', 'تعويذة'],
    description: '🔮 عرض وشراء التعاويذ (مرة يومياً، حد أسبوعي 15)',
    category: 'مملكة',
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
            const args = msg.message?.conversation?.split(' ') || msg.message?.extendedTextMessage?.text?.split(' ') || [];
            
            // ===== التحقق من وجود مملكة =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                    `📌 استخدم .لاعب جديد لتأسيس مملكتك.`
                ], msg, [sender]);
                return;
            }

            // ===== تحميل البيانات من النظام المنفصل =====
            let user = loadUserData(sender);
            user = sanitizeUser(user);
            saveUserData(sender, user);

            const points = loadJSON(pointsPath);
            let playerPoints = points[sender] || 0;

            // إعادة ضبط يومي للتعاويذ الفردية
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            if (now - user.lastSpellReset > oneDay) {
                user.spellsUsed = { 
                    dragonFlame: 0, kingsHeal: 0, lightningStorm: 0, 
                    ragingBull: 0, freeze: 0, cyclone: 0, curse: 0 
                };
                user.lastSpellReset = now;
                saveUserData(sender, user);
            }

            // عرض القائمة إذا لم يحدد تعويذة
            if (args.length < 2) {
                const remainingWeekly = Math.max(0, 15 - (user.totalSpellsUsedWeekly || 0));
                const lines = [
                    `👑 @${sender.split('@')[0]}`,
                    `💰 رصيدك: ${playerPoints} نقطة`,
                    `📦 متبقي هذا الأسبوع: ${remainingWeekly} تعويذة`,
                    ``,
                    `📋 *قائمة التعاويذ:*`
                ];

                for (const [name, data] of Object.entries(spells)) {
                    const used = user.spellsUsed[data.key] || 0;
                    const status = used >= 1 ? '✅ مستخدم اليوم' : '🟢 متاح';
                    const emoji = data.key === 'curse' ? '☠️' : 
                                 data.key === 'freeze' ? '❄️' :
                                 data.key === 'cyclone' ? '🌪️' :
                                 data.key === 'ragingBull' ? '🐂' :
                                 data.key === 'lightningStorm' ? '⚡' :
                                 data.key === 'kingsHeal' ? '💖' : '🔥';
                    lines.push(`  ${emoji} *${name}*`);
                    lines.push(`     💰 ${data.cost} نقطة | ${data.desc}`);
                    lines.push(`     📊 الحالة: ${status}`);
                    lines.push('');
                }

                lines.push(`💡 *للشراء:* .تعويذات [اسم التعويذة]`);
                lines.push(`📝 مثال: .تعويذات لهيب التنين`);
                lines.push(`📝 مثال: .تعويذات شفاء الملك`);

                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // البحث عن التعويذة
            const spellName = args.slice(1).join(' ').trim();
            let foundSpell = null;
            let foundKey = null;

            for (const [name, data] of Object.entries(spells)) {
                if (name.includes(spellName) || spellName.includes(name) || 
                    data.key.toLowerCase().includes(spellName.toLowerCase())) {
                    foundSpell = data;
                    foundKey = name;
                    break;
                }
            }

            if (!foundSpell) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، تعويذة غير معروفة.`,
                    `📌 استخدم .تعويذات لعرض القائمة.`
                ], msg, [sender]);
                return;
            }

            // التحقق من الرصيد
            if (playerPoints < foundSpell.cost) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، رصيدك لا يكفي!`,
                    `💰 تحتاج: ${foundSpell.cost} نقطة`,
                    `💰 رصيدك: ${playerPoints} نقطة`
                ], msg, [sender]);
                return;
            }

            // التحقق من الاستخدام اليومي
            if (user.spellsUsed[foundSpell.key] >= 1) {
                await sendMessage(sock, chatId, [
                    `⚠️ @${sender.split('@')[0]}، لقد استخدمت *${foundKey}* اليوم بالفعل.`,
                    `📌 يمكنك استخدامها مرة واحدة فقط في اليوم.`,
                    `📌 انتظر حتى منتصف الليل لتستخدمها مرة أخرى.`
                ], msg, [sender]);
                return;
            }

            // التحقق من الحد الأسبوعي (15)
            if (user.totalSpellsUsedWeekly >= 15) {
                await sendMessage(sock, chatId, [
                    `⚠️ @${sender.split('@')[0]}، وصلت للحد الأقصى للتعاويذ هذا الأسبوع (15).`,
                    `📌 يمكنك شراء المزيد بعد يوم الأحد القادم.`
                ], msg, [sender]);
                return;
            }

            // ===== تنفيذ الشراء والتفعيل =====
            points[sender] = playerPoints - foundSpell.cost;
            user.spellsUsed[foundSpell.key] = (user.spellsUsed[foundSpell.key] || 0) + 1;
            user.totalSpellsUsedWeekly = (user.totalSpellsUsedWeekly || 0) + 1;
            user.lastActive = Date.now();
            
            if (!user.spellEffects) user.spellEffects = {};
            user.spellEffects[foundSpell.key] = true;

            saveJSON(pointsPath, points);
            saveUserData(sender, user);

            const remainingWeekly = Math.max(0, 15 - user.totalSpellsUsedWeekly);
            const lines = [
                `✅ @${sender.split('@')[0]}`,
                `🔮 تم شراء وتفعيل *${foundKey}* بنجاح!`,
                ``,
                `📋 ${foundSpell.effect}`,
                `💰 تم خصم ${foundSpell.cost} نقطة`,
                `💰 رصيدك الآن: ${points[sender]} نقطة`,
                `📦 متبقي هذا الأسبوع: ${remainingWeekly} تعويذة`,
                ``,
                `📌 استخدم .تعويذات مرة أخرى لشراء تعويذة أخرى`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر تعويذات:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                `❌ حدث خطأ أثناء شراء التعويذة.`,
                `📌 حاول مرة أخرى لاحقاً.`
            ], msg);
        }
    }
};