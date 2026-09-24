// لاعب.js - نظام تأسيس المملكة (نسخة محسنة ومتوافقة مع نظام التخزين المنفصل)
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
        console.error('❌ فشل حفظ:', file, e.message);
        return false;
    }
}

// ========== دوال التخزين المنفصل ==========
function saveUserData(jid, data) {
    // الملف الأساسي
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

    // الموارد
    const resources = loadJSON(RESOURCES_PATH);
    resources[jid] = data.resources || { wood: 100, stone: 50, iron: 20 };
    saveJSON(RESOURCES_PATH, resources);

    // المباني
    const buildings = loadJSON(BUILDINGS_PATH);
    buildings[jid] = data.buildings || {
        barracks: { level: 0, effect: 'يزيد عدد الجنود' },
        quarry: { level: 0, effect: '+10 حجر يومياً' },
        lumberMill: { level: 0, effect: '+10 خشب يومياً' },
        ironMine: { level: 0, effect: '+5 حديد يومياً' }
    };
    saveJSON(BUILDINGS_PATH, buildings);

    // الجنود
    const soldiers = loadJSON(SOLDIERS_PATH);
    soldiers[jid] = data.soldiers || {
        normal: 0, knight: 0, archer: 0, eliteGuard: 0, dragonSpearman: 0, legendaryCommander: 0
    };
    saveJSON(SOLDIERS_PATH, soldiers);

    // الأسلحة
    const weapons = loadJSON(WEAPONS_PATH);
    weapons[jid] = data.weapons || {
        ironSword: 0, goldenShield: 0, legendaryBow: 0, lightningSword: 0,
        giantHammer: 0, deathBow: 0, destructionAxe: 0, heroSword: 0,
        timeBow: 0, eternalBlade: 0, fireShield: 0, godShield: 0
    };
    saveJSON(WEAPONS_PATH, weapons);

    // الإكسسوارات
    const accessories = loadJSON(ACCESSORIES_PATH);
    accessories[jid] = data.accessories || {
        powerRing: 0, protectionRing: 0, kingsCrown: 0, shadowMask: 0, heroMask: 0
    };
    saveJSON(ACCESSORIES_PATH, accessories);

    // الجرعات
    const potions = loadJSON(POTIONS_PATH);
    potions[jid] = data.potions || {
        smallHeal: 0, largeHeal: 0, energyPotion: 0, craftedHeal: 0
    };
    saveJSON(POTIONS_PATH, potions);

    // التعاويذ
    const spells = loadJSON(SPELLS_PATH);
    spells[jid] = data.spellsUsed || {
        dragonFlame: 0, kingsHeal: 0, lightningStorm: 0, ragingBull: 0,
        freeze: 0, cyclone: 0, curse: 0
    };
    saveJSON(SPELLS_PATH, spells);

    // الإحصائيات
    const stats = loadJSON(STATS_PATH);
    stats[jid] = {
        pvpWins: data.pvpWins || 0,
        pvpLosses: data.pvpLosses || 0,
        monstersDefeated: data.monstersDefeated || 0
    };
    saveJSON(STATS_PATH, stats);

    // النشاط
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
        lastSpellReset: data.lastSpellReset || Date.now(),
        totalSpellsUsedWeekly: data.totalSpellsUsedWeekly || 0,
        upgradeCountToday: data.upgradeCountToday || 0,
        lastUpgradeReset: data.lastUpgradeReset || 0,
        upgradeRestStage: data.upgradeRestStage || 0,
        upgradeRestStartTime: data.upgradeRestStartTime || 0,
        upgradeCountSinceRest: data.upgradeCountSinceRest || 0
    };
    saveJSON(ACTIVE_PATH, active);

    // كتاب الأرواح
    const soulBook = loadJSON(SOULBOOK_PATH);
    soulBook[jid] = data.soulBook || { pages: 0, spirits: [] };
    saveJSON(SOULBOOK_PATH, soulBook);

    // الرفيق
    const companion = loadJSON(COMPANION_PATH);
    companion[jid] = data.companion || null;
    saveJSON(COMPANION_PATH, companion);
}

function userExists(jid) {
    const main = loadJSON(MAIN_PATH);
    return !!main[jid];
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🏰 نـظـام الـمـمـلـكـة 🏰\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== دالة استخراج النص من الرسالة ==========
function getMessageText(msg) {
    try {
        if (msg.message?.conversation) return msg.message.conversation;
        if (msg.message?.extendedTextMessage?.text) return msg.message.extendedTextMessage.text;
        if (msg.message?.imageMessage?.caption) return msg.message.imageMessage.caption;
        if (msg.message?.videoMessage?.caption) return msg.message.videoMessage.caption;
        if (msg.message?.documentMessage?.caption) return msg.message.documentMessage.caption;
        if (msg.message?.buttonsResponseMessage?.selectedDisplayText)
            return msg.message.buttonsResponseMessage.selectedDisplayText;
        if (msg.message?.listResponseMessage?.singleSelectReply?.selectedDisplayText)
            return msg.message.listResponseMessage.singleSelectReply.selectedDisplayText;
        for (const key of Object.keys(msg.message || {})) {
            if (msg.message[key]?.text) return msg.message[key].text;
            if (msg.message[key]?.caption) return msg.message[key].caption;
        }
        return '';
    } catch {
        return '';
    }
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: 'لاعب',
    description: '🏰 نظام تأسيس المملكة (استخدم .لاعب جديد لإنشاء مملكة)',
    category: 'مملكة',
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            // استخراج النص والأمر الفرعي
            const fullText = getMessageText(msg);
            const args = fullText.trim().split(/\s+/).slice(1);
            const subCommand = (args[0] || '').toLowerCase();

            // ===== إذا كان .لاعب فقط أو أمر غير معروف =====
            if (!subCommand || subCommand !== 'جديد') {
                const lines = [
                    `👑 @${sender.split('@')[0]}، مرحباً بك في عالم الممالك!`,
                    '',
                    '📖 *شرح سريع:*',
                    '📌 استخدم `.لاعب جديد` لتأسيس مملكتك.',
                    '📌 ستحصل على 500 نقطة هدية.',
                    '',
                    '📜 *بعد التأسيس: استخدم .مملكتي لعرض مملكتك*'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // ===== .لاعب جديد =====
            // التحقق من وجود مملكة
            if (userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `⚠️ @${sender.split('@')[0]}، لديك مملكة بالفعل!`,
                    '📌 استخدم .مملكتي لعرضها.'
                ], msg, [sender]);
                return;
            }

            // بدء عملية التسجيل
            await sendMessage(sock, chatId, [
                `📝 @${sender.split('@')[0]}، أهلاً بك في عالم الممالك!`,
                '✍️ الرجاء إدخال اسم مملكتك:',
                '📌 يجب أن يكون الاسم بين 3 و 30 حرفاً.'
            ], msg, [sender]);

            // انتظار رد المستخدم
            const ask = async (question) => {
                await sock.sendMessage(chatId, { text: question, mentions: [sender] });

                return new Promise((resolve) => {
                    const handler = async ({ messages }) => {
                        for (const m of messages) {
                            const from = m.key.participant || m.participant || m.key.remoteJid;
                            if (from !== sender) continue;

                            sock.ev.off('messages.upsert', handler);

                            const text = getMessageText(m);
                            resolve(text.trim());
                        }
                    };
                    sock.ev.on('messages.upsert', handler);
                });
            };

            // استقبال الاسم
            let kingdomName = '';
            let valid = false;
            while (!valid) {
                kingdomName = await ask(`📝 @${sender.split('@')[0]}، ما هو اسم مملكتك؟\n اكتب اسم مملكتك مباشراً`);
                if (kingdomName.length >= 3 && kingdomName.length <= 30) {
                    valid = true;
                } else {
                    await sendMessage(sock, chatId, [
                        '❌ الاسم يجب أن يكون بين 3 و 30 حرفاً.',
                        '📌 حاول مرة أخرى.'
                    ], msg, [sender]);
                }
            }

            // إنشاء المملكة في النظام المنفصل
            const userData = {
                level: 1,
                prosperity: 0,
                lands: 0,
                gold: 0,
                monstersDefeated: 0,
                name: kingdomName,
                owner: sender,
                nameChangesUsed: 0,
                resources: { wood: 100, stone: 50, iron: 20 },
                buildings: {
                    barracks: { level: 0, effect: 'يزيد عدد الجنود' },
                    quarry: { level: 0, effect: '+10 حجر يومياً' },
                    lumberMill: { level: 0, effect: '+10 خشب يومياً' },
                    ironMine: { level: 0, effect: '+5 حديد يومياً' }
                },
                companion: null,
                soulBook: { pages: 0, spirits: [] },
                soldiers: { normal: 0, knight: 0, archer: 0, eliteGuard: 0, dragonSpearman: 0, legendaryCommander: 0 },
                weapons: { ironSword: 0, goldenShield: 0, legendaryBow: 0, lightningSword: 0, giantHammer: 0, deathBow: 0, destructionAxe: 0, heroSword: 0, timeBow: 0, eternalBlade: 0, fireShield: 0, godShield: 0 },
                accessories: { powerRing: 0, protectionRing: 0, kingsCrown: 0, shadowMask: 0, heroMask: 0 },
                potions: { smallHeal: 0, largeHeal: 0, energyPotion: 0, craftedHeal: 0 },
                spellsUsed: { dragonFlame: 0, kingsHeal: 0, lightningStorm: 0, ragingBull: 0, freeze: 0, cyclone: 0, curse: 0 },
                lastSpellReset: Date.now(),
                totalSpellsUsedWeekly: 0,
                upgradeCountToday: 0,
                lastUpgradeReset: 0,
                upgradeRestStage: 0,
                upgradeRestStartTime: 0,
                upgradeCountSinceRest: 0,
                lastDaily: 0,
                lastAttack: 0,
                attacksToday: 0,
                lastAttackReset: 0,
                attackRestStage: 0,
                attackRestStartTime: 0,
                attackCountSinceRest: 0,
                lastMonsterFight: 0,
                monsterFightCount: 0,
                restStage: 0,
                restStartTime: 0,
                pvpWins: 0,
                pvpLosses: 0,
                lastActive: Date.now()
            };

            saveUserData(sender, userData);

            // منح 500 نقطة
            const points = loadJSON(pointsPath);
            points[sender] = (points[sender] || 0) + 500;
            saveJSON(pointsPath, points);

            // رسالة الترحيب
            const lines = [
                `👑 @${sender.split('@')[0]}، تم تأسيس مملكتك!`,
                `🏰 اسم المملكة: *${kingdomName}*`,
                `✨ المستوى: 1`,
                `📈 الازدهار: 0 💎`,
                `🗺️ الأراضي: 0 أرض`,
                `🪵 الخشب: 100  |  🪨 الحجر: 50  |  ⛏️ الحديد: 20`,
                `💰 تم منحك 500 نقطة كهدية بداية.`,
                `🎮 استخدم .مملكتي لعرض التفاصيل الكاملة.`,
                '',
                `📜 أوامرك السريعة:`,
                `   • .تطور  • .دخل  • .وحش  • .غزو  • .مهمة`,
                `   • .متجر  • .مخزن  • .رفيق  • .كتاب  • .صياغة`,
                `   • .ترتيب  • .تحويل  • .سرقة  • .معاهدة`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر لاعب:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};