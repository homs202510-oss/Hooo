// اكشف.js - التجسس على مملكة لاعب آخر (مقابل نقاط)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const RESOURCES_PATH = path.join(dataDir, 'kd-resources.json');
const SOLDIERS_PATH = path.join(dataDir, 'kd-soldiers.json');
const WEAPONS_PATH = path.join(dataDir, 'kd-weapons.json');
const ACCESSORIES_PATH = path.join(dataDir, 'kd-accessories.json');
const STATS_PATH = path.join(dataDir, 'kd-stats.json');
const ACTIVE_PATH = path.join(dataDir, 'kd-active.json');

// ===== التأكد من وجود الملفات =====
const allPaths = [MAIN_PATH, RESOURCES_PATH, SOLDIERS_PATH, WEAPONS_PATH, ACCESSORIES_PATH, STATS_PATH, ACTIVE_PATH];
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
        console.error('❌ فشل حفظ:', file, e.message);
        return false;
    }
}

// ========== دوال التخزين المنفصل ==========
function loadUserData(jid) {
    const main = loadJSON(MAIN_PATH)[jid] || {};
    const resources = loadJSON(RESOURCES_PATH)[jid] || {};
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
        resources: resources,
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

    const resources = loadJSON(RESOURCES_PATH);
    resources[jid] = data.resources || {};
    saveJSON(RESOURCES_PATH, resources);

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

// ========== دوال حساب القوة ==========
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

// ========== حساب سعر التجسس ==========
function getSpyCost(victimLevel) {
    // السعر = مستوى الضحية × 50، مع حد أدنى 1000 وحد أقصى 50000
    let cost = victimLevel * 50;
    if (cost < 1000) cost = 1000;
    if (cost > 50000) cost = 50000;
    return cost;
}

// ========== دالة استخراج المنشن ==========
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

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `🕵️ عـمـلـيـة تـجـسـس 🕵️\n`;
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
    command: ['اكشف', 'تجسس'],
    description: '🕵️ التجسس على مملكة لاعب آخر (مقابل نقاط)',
    category: 'مملكة',
    usage: '.اكشف @منشن أو رد على رسالة',
    example: '.اكشف @منشن',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            // ===== استخراج الهدف =====
            const mentioned = extractMentions(msg);
            const quotedSender = msg.message?.extendedTextMessage?.contextInfo?.participant || null;
            let target = null;

            if (mentioned.length > 0) {
                target = mentioned[0];
            } else if (quotedSender) {
                target = quotedSender;
            } else {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}`,
                    `📌 يجب منشن الشخص أو الرد على رسالته.`,
                    `📝 مثال: .اكشف @منشن`
                ], msg, [sender]);
                return;
            }

            if (target === sender) {
                await sendMessage(sock, chatId, [
                    `❌ لا يمكنك التجسس على نفسك!`
                ], msg, [sender]);
                return;
            }

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
                    '📌 لا يمكن التجسس على شخص ليس لديه مملكة.'
                ], msg, [target]);
                return;
            }

            // ===== تحميل بيانات الطرفين =====
            const points = loadJSON(pointsPath);
            const attacker = loadUserData(sender);
            const defender = loadUserData(target);

            // ===== حساب سعر التجسس =====
            const spyCost = getSpyCost(defender.level);
            const attackerPoints = points[sender] || 0;

            // ===== التحقق من الرصيد =====
            if (attackerPoints < spyCost) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، رصيدك لا يكفي للتجسس!`,
                    `💰 سعر التجسس: ${spyCost} نقطة`,
                    `💰 رصيدك: ${attackerPoints} نقطة`,
                    `💔 تحتاج: ${spyCost - attackerPoints} نقطة إضافية`,
                    `📌 يمكنك كسب النقاط من الألعاب والفعاليات.`
                ], msg, [sender]);
                return;
            }

            // ===== حساب قوة الطرفين =====
            const attackerPower = getPlayerPower(attacker);
            const defenderPower = getPlayerPower(defender);

            // ===== التحقق من فشل التجسس (الجنود يقظة) =====
            let failed = false;
            let failReason = '';

            // إذا كانت قوة المدافع أكبر من قوة المهاجم، يفشل التجسس
            if (defenderPower > attackerPower) {
                failed = true;
                failReason = 'لدى الضحية جنود يقظة ودفاعات قوية، اكتشفوا محاولة التجسس!';
            }

            // ===== خصم النقاط (سواء نجح أو فشل) =====
            points[sender] = attackerPoints - spyCost;
            saveJSON(pointsPath, points);

            // تحديث وقت النشاط
            attacker.lastActive = Date.now();
            saveUserData(sender, attacker);

            // ===== إذا فشل التجسس =====
            if (failed) {
                await sendMessage(sock, chatId, [
                    `🕵️ @${sender.split('@')[0]} حاول التجسس على @${target.split('@')[0]}`,
                    ``,
                    `❌ *فشلت عملية التجسس!*`,
                    `⚠️ ${failReason}`,
                    ``,
                    `💰 تم خصم ${spyCost} نقطة (رسوم المحاولة).`,
                    `💰 رصيدك المتبقي: ${points[sender]} نقطة`,
                    ``,
                    `💡 طور جيشك وزد قوتك لتتمكن من التجسس بنجاح.`
                ], msg, [sender, target]);
                return;
            }

            // ===== نجاح التجسس =====
            // عرض معلومات مملكة الضحية
            const defenderStats = calculateStats(defender.level, defender.soldiers, defender.weapons, defender.accessories);

            // تجميع معلومات الجنود
            const soldierNames = {
                'normal': '👨‍🌾 جندي عادي',
                'knight': '🏇 فارس',
                'archer': '🏹 رامٍ',
                'eliteGuard': '🛡️ حارس النخبة',
                'dragonSpearman': '🐉 منشق التنين',
                'legendaryCommander': '⚔️ قائد أسطوري'
            };
            const soldierList = Object.entries(defender.soldiers || {})
                .filter(([key, count]) => count > 0)
                .map(([key, count]) => `${soldierNames[key] || key}: ${count}`)
                .join(' | ') || 'لا يوجد جنود';

            // تجميع معلومات الأسلحة والدروع
            const weaponNames = {
                'ironSword': '🗡️ سيف حديدي',
                'goldenShield': '🛡️ درع ذهبي',
                'legendaryBow': '🏹 قوس أسطوري',
                'lightningSword': '⚔️ سيف البرق',
                'giantHammer': '🔨 مطرقة العمالقة',
                'deathBow': '🏹 قوس الموت',
                'destructionAxe': '🪓 فأس الدمار',
                'heroSword': '🗡️ سيف الأبطال',
                'timeBow': '🏹 قوس الزمن',
                'eternalBlade': '⚔️ نصل الأبدية',
                'fireShield': '🔥 درع النار',
                'godShield': '✨ درع الملك'
            };
            const weaponList = Object.entries(defender.weapons || {})
                .filter(([key, count]) => count > 0)
                .map(([key, count]) => `${weaponNames[key] || key}: ${count}`)
                .join(' | ') || 'لا توجد أسلحة';

            // تجميع معلومات الإكسسوارات
            const accessoryNames = {
                'powerRing': '💍 خاتم القوة',
                'protectionRing': '💍 خاتم الحماية',
                'kingsCrown': '👑 تاج الملوك',
                'shadowMask': '🎭 قناع الظل',
                'heroMask': '🎭 قناع البطل'
            };
            const accessoryList = Object.entries(defender.accessories || {})
                .filter(([key, count]) => count > 0)
                .map(([key, count]) => `${accessoryNames[key] || key}: ${count}`)
                .join(' | ') || 'لا توجد إكسسوارات';

            const lines = [
                `🕵️ @${sender.split('@')[0]} نجح في التجسس على @${target.split('@')[0]}!`,
                ``,
                `📊 *معلومات مملكة الضحية:*`,
                `👑 الاسم: ${defender.name}`,
                `✨ المستوى: ${defender.level}`,
                `📈 الازدهار: ${defender.prosperity} 💎`,
                `🗺️ الأراضي: ${defender.lands} أرض`,
                `❤️ الصحة: ${defenderStats.health}`,
                `⚔️ الهجوم: ${defenderStats.attack}`,
                `🛡️ الدفاع: ${defenderStats.defense}`,
                `💪 القوة الإجمالية: ${defenderPower}`,
                `🏆 انتصارات PvP: ${defender.pvpWins} | هزائم: ${defender.pvpLosses}`,
                `🐉 وحوش قتلت: ${defender.monstersDefeated}`,
                ``,
                `📊 *الموارد:*`,
                `🪵 خشب: ${defender.resources?.wood || 0}`,
                `🪨 حجر: ${defender.resources?.stone || 0}`,
                `⛏️ حديد: ${defender.resources?.iron || 0}`,
                ``,
                `👥 *الجنود:*`,
                `   ${soldierList}`,
                ``,
                `⚔️ *الأسلحة:*`,
                `   ${weaponList}`,
                ``,
                `💍 *الإكسسوارات:*`,
                `   ${accessoryList}`,
                ``,
                `💰 تم خصم ${spyCost} نقطة (رسوم التجسس).`,
                `💰 رصيدك المتبقي: ${points[sender]} نقطة`,
                ``,
                `📌 استخدم هذه المعلومات بحكمة!`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender, target]);

        } catch (error) {
            console.error('✗ خطأ في أمر اكشف:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء التجسس.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};