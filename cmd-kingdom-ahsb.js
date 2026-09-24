// احسب.js - حساب نتيجة محاربة وحش أو هجوم على مملكة (محاكاة بدون خصم نقاط)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const teamsPath = path.join(__dirname, 'db-teams.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const SOLDIERS_PATH = path.join(dataDir, 'kd-soldiers.json');
const WEAPONS_PATH = path.join(dataDir, 'kd-weapons.json');
const ACCESSORIES_PATH = path.join(dataDir, 'kd-accessories.json');

// ===== التأكد من وجود الملفات =====
if (!fs.existsSync(MAIN_PATH)) fs.writeFileSync(MAIN_PATH, JSON.stringify({}, null, 2));
if (!fs.existsSync(SOLDIERS_PATH)) fs.writeFileSync(SOLDIERS_PATH, JSON.stringify({}, null, 2));
if (!fs.existsSync(WEAPONS_PATH)) fs.writeFileSync(WEAPONS_PATH, JSON.stringify({}, null, 2));
if (!fs.existsSync(ACCESSORIES_PATH)) fs.writeFileSync(ACCESSORIES_PATH, JSON.stringify({}, null, 2));
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
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
    const soldiers = loadJSON(SOLDIERS_PATH)[jid] || {};
    const weapons = loadJSON(WEAPONS_PATH)[jid] || {};
    const accessories = loadJSON(ACCESSORIES_PATH)[jid] || {};

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
        accessories: accessories
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

function getMonsterPower(level) {
    return Math.floor(20 + (level * 1.5));
}

function getMonsterName(level) {
    if (level < 10) return '👹 عفريت صغير';
    if (level < 50) return '🐺 ذئب متوحش';
    if (level < 200) return '🧟 غول مقبرة';
    if (level < 1000) return '🐉 تنين ناري';
    if (level < 5000) return '👑 ملك العفاريت';
    if (level < 20000) return '🐲 التنين الأزرق';
    return '💀 لورد الظلام الأبدي';
}

function getMonsterRewards(monsterLevel) {
    const monsterPower = getMonsterPower(monsterLevel);
    const points = Math.floor(monsterPower);
    const lands = Math.floor(monsterLevel / 100) + 1;
    const exp = Math.floor(monsterLevel * 0.01) + 1;
    const wood = Math.floor(monsterLevel * 0.8);
    const stone = Math.floor(monsterLevel * 0.5);
    const iron = Math.floor(monsterLevel * 0.3);
    const prosperity = Math.floor(monsterLevel / 50);
    return { points, lands, exp, wood, stone, iron, prosperity };
}

// ========== دوال الفرق ==========
function loadTeams() { return loadJSON(teamsPath); }

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

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `🧮 حـسـاب نـتـيـجـة الـقـتـال 🧮\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
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

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['احسب', 'حساب'],
    description: '🧮 حساب نتيجة محاربة وحش أو هجوم على مملكة (محاكاة بدون خصم نقاط)',
    category: 'مملكة',
    usage: '.احسب [وحش|هجوم] [المعاملات]',
    example: '.احسب وحش 50  أو  .احسب هجوم @منشن',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/);

            if (args.length < 2) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}`,
                    `📌 استخدم:`,
                    `   • .احسب وحش [مستوى الوحش]`,
                    `   • .احسب هجوم @منشن`,
                    `📝 أمثلة:`,
                    `   .احسب وحش 50`,
                    `   .احسب هجوم @منشن`
                ], msg, [sender]);
                return;
            }

            const type = args[1].toLowerCase();

            // ============================================================
            // حالة: حساب وحش
            // ============================================================
            if (type === 'وحش' || type === 'monster') {
                if (args.length < 3) {
                    await sendMessage(sock, chatId, [
                        `❌ @${sender.split('@')[0]}`,
                        `📌 استخدم: .احسب وحش [مستوى الوحش]`,
                        `📝 مثال: .احسب وحش 50`
                    ], msg, [sender]);
                    return;
                }

                const monsterLevelRaw = args[2];
                const monsterLevel = parseInt(monsterLevelRaw);

                if (isNaN(monsterLevel) || !isFinite(monsterLevel) || monsterLevel <= 0) {
                    await sendMessage(sock, chatId, [
                        `❌ @${sender.split('@')[0]}، مستوى الوحش يجب أن يكون رقماً موجباً صحيحاً.`,
                        `📝 مثال: .احسب وحش 5`
                    ], msg, [sender]);
                    return;
                }

                if (monsterLevel > 1000000) {
                    await sendMessage(sock, chatId, [
                        `❌ @${sender.split('@')[0]}، مستوى الوحش كبير جداً.`,
                        `📌 اختر مستوى أقل من 1,000,000.`
                    ], msg, [sender]);
                    return;
                }

                if (!userExists(sender)) {
                    await sendMessage(sock, chatId, [
                        `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                        `📌 استخدم .لاعب جديد لتأسيس مملكتك.`
                    ], msg, [sender]);
                    return;
                }

                const user = loadUserData(sender);
                const points = loadJSON(pointsPath);
                const userPoints = points[sender] || 0;

                const playerPower = getPlayerPower(user);
                const monsterPower = getMonsterPower(monsterLevel);
                const monsterName = getMonsterName(monsterLevel);
                const rewards = getMonsterRewards(monsterLevel);
                const playerStats = calculateStats(user.level, user.soldiers, user.weapons, user.accessories);

                let winChance = 0;
                let resultText = '';
                let emoji = '';
                const levelDifference = monsterLevel - user.level;
                let autoLose = false;

                if (levelDifference >= 50) {
                    autoLose = true;
                    winChance = 0;
                    resultText = 'خسارة تلقائية!';
                    emoji = '💀';
                } else if (playerPower > monsterPower) {
                    winChance = 70 + Math.floor(Math.random() * 20);
                    resultText = 'فرصة فوز عالية';
                    emoji = '🔥';
                } else if (playerPower < monsterPower) {
                    winChance = 10 + Math.floor(Math.random() * 30);
                    resultText = 'فرصة فوز منخفضة';
                    emoji = '⚠️';
                } else {
                    winChance = 45 + Math.floor(Math.random() * 11);
                    resultText = 'فرصة متساوية';
                    emoji = '⚖️';
                }

                const lines = [
                    `🐉 *محاكاة محاربة وحش*`,
                    ``,
                    `👤 @${sender.split('@')[0]}`,
                    `   🏰 المستوى: ${user.level}`,
                    `   💪 القوة: ${playerPower}`,
                    `   💰 نقاطك: ${userPoints}`,
                    ``,
                    `🐉 *الوحش:* ${monsterName}`,
                    `   📊 المستوى: ${monsterLevel}`,
                    `   ⚔️ القوة: ${monsterPower}`,
                    ``,
                    `📊 *النتيجة المتوقعة:*`,
                    `   ${emoji} نسبة الفوز: ${winChance}%`,
                    `   📝 ${resultText}`,
                    ...(autoLose ? [`   ⚠️ *الوحش أقوى منك بـ ${levelDifference} مستوى!*`] : []),
                    ...(levelDifference >= 30 && !autoLose ? [`   ⚠️ الفرق ${levelDifference} مستوى، يُنصح بالتطوير أولاً.`] : []),
                    ``,
                    `🏆 *المكافآت المتوقعة:*`,
                    `   💰 نقاط: +${rewards.points}`,
                    `   🪵 خشب: +${rewards.wood}`,
                    `   🪨 حجر: +${rewards.stone}`,
                    `   ⛏️ حديد: +${rewards.iron}`,
                    `   📈 ازدهار: +${rewards.prosperity}`,
                    `   🌍 أراضي: +${rewards.lands}`,
                    ``,
                    `📌 استخدم .وحش ${monsterLevel} لخوض المعركة الفعلية.`
                ];

                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // ============================================================
            // حالة: حساب هجوم على مملكة
            // ============================================================
            if (type === 'هجوم' || type === 'attack' || type === 'غزو') {
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
                        `📝 مثال: .احسب هجوم @منشن`
                    ], msg, [sender]);
                    return;
                }

                if (target === sender) {
                    await sendMessage(sock, chatId, ['❌ لا يمكنك حساب هجوم على نفسك!'], msg, [sender]);
                    return;
                }

                if (!userExists(sender)) {
                    await sendMessage(sock, chatId, [
                        `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                        `📌 استخدم .لاعب جديد لتأسيس مملكتك.`
                    ], msg, [sender]);
                    return;
                }

                if (!userExists(target)) {
                    await sendMessage(sock, chatId, [
                        `❌ @${target.split('@')[0]}، ليس لديه مملكة.`,
                        `📌 لا يمكن حساب هجوم على شخص ليس لديه مملكة.`
                    ], msg, [sender, target]);
                    return;
                }

                // ===== تحميل بيانات الطرفين =====
                const attacker = loadUserData(sender);
                const defender = loadUserData(target);
                const points = loadJSON(pointsPath);
                const teams = loadTeams();

                const attackerPoints = points[sender] || 0;
                const defenderPoints = points[target] || 0;

                // ===== حساب قوة الطرفين (مع دعم الفرق) =====
                let attackerPower = getPlayerPower(attacker);
                let defenderPower = getPlayerPower(defender);
                let attackerTeamName = null;
                let defenderTeamName = null;

                const attackerTeam = getTeamNameByMember(sender, teams);
                const defenderTeam = getTeamNameByMember(target, teams);

                if (attackerTeam) {
                    const team = getTeam(attackerTeam, teams);
                    if (team) {
                        attackerTeamName = attackerTeam;
                        const teamPower = calculateTeamPower(team);
                        attackerPower += Math.floor(teamPower * 0.3);
                    }
                }

                if (defenderTeam) {
                    const team = getTeam(defenderTeam, teams);
                    if (team) {
                        defenderTeamName = defenderTeam;
                        const teamPower = calculateTeamPower(team);
                        defenderPower = Math.max(defenderPower, teamPower);
                    }
                }

                // ===== تحديد نسبة الفوز =====
                let winChance = 0;
                let resultText = '';
                let emoji = '';
                let isAttackerWinner = false;

                if (attackerPower > defenderPower) {
                    isAttackerWinner = Math.random() * 100 < 70;
                    winChance = 70 + Math.floor(Math.random() * 20);
                    resultText = 'فرصة فوز عالية للمهاجم';
                    emoji = '🔥';
                } else if (attackerPower < defenderPower) {
                    isAttackerWinner = Math.random() * 100 < 30;
                    winChance = 10 + Math.floor(Math.random() * 30);
                    resultText = 'فرصة فوز منخفضة للمهاجم';
                    emoji = '⚠️';
                } else {
                    isAttackerWinner = Math.random() * 100 < 50;
                    winChance = 45 + Math.floor(Math.random() * 11);
                    resultText = 'فرصة متساوية';
                    emoji = '⚖️';
                }

                // ===== النقاط المنقولة المتوقعة =====
                const TRANSFER_PERCENT = 0.35;
                const MAX_TRANSFER_BASE = 1000;
                let transferPoints = 0;

                if (isAttackerWinner) {
                    const loserPoints = defenderPoints;
                    transferPoints = Math.floor(loserPoints * TRANSFER_PERCENT);
                    const maxTransfer = MAX_TRANSFER_BASE + (defender.level * 3);
                    transferPoints = Math.min(transferPoints, maxTransfer);
                } else {
                    const loserPoints = attackerPoints;
                    transferPoints = Math.floor(loserPoints * TRANSFER_PERCENT);
                    const maxTransfer = MAX_TRANSFER_BASE + (attacker.level * 3);
                    transferPoints = Math.min(transferPoints, maxTransfer);
                }

  // ===== بناء الرسالة =====
                const attackerStats = calculateStats(attacker.level, attacker.soldiers, attacker.weapons, attacker.accessories);
                const defenderStats = calculateStats(defender.level, defender.soldiers, defender.weapons, defender.accessories);

                const lines = [
                    `⚔️ *محاكاة هجوم على مملكة*`,
                    ``,
                    `👤 *المهاجم:* @${sender.split('@')[0]}`,
                    `   🏰 المستوى: ${attacker.level}`,
                    `   💪 القوة: ${getPlayerPower(attacker)}`,
                    `   💰 النقاط: ${attackerPoints}`,
                    ...(attackerTeamName ? [`   🏴 الفريق: ${attackerTeamName}`] : []),
                    ``,
                    `🛡️ *المدافع:* @${target.split('@')[0]}`,
                    `   🏰 المستوى: ${defender.level}`,
                    `   💪 القوة: ${getPlayerPower(defender)}`,
                    `   💰 النقاط: ${defenderPoints}`,
                    ...(defenderTeamName ? [`   🏴 الفريق: ${defenderTeamName}`] : []),
                    ``,
                    `📊 *قوة المعركة:*`,
                    `   💥 قوة المهاجم (مع دعم الفريق): ${attackerPower}`,
                    `   🛡️ قوة المدافع (مع دعم الفريق): ${defenderPower}`,
                    ``,
                    `📊 *النتيجة المتوقعة:*`,
                    `   ${emoji} نسبة فوز المهاجم: ${winChance}%`,
                    `   📝 ${resultText}`,
                    ``,
                    `💰 *النقاط المنقولة المتوقعة:*`,
                    `   ${isAttackerWinner ? '🏆 فوز المهاجم' : '🏆 فوز المدافع'}`,
                    `   💰 ${transferPoints} نقطة`,
                    ``,
                    `📌 استخدم .هجوم @${target.split('@')[0]} لخوض المعركة الفعلية.`,
                    `📌 هذه مجرد محاكاة، النتائج الفعلية قد تختلف.`
                ];

                await sendMessage(sock, chatId, lines, msg, [sender, target]);
                return;
            }

            // ============================================================
            // أمر غير معروف
            // ============================================================
            await sendMessage(sock, chatId, [
                `❌ @${sender.split('@')[0]}، أمر غير معروف.`,
                `📌 استخدم:`,
                `   • .احسب وحش [مستوى الوحش]`,
                `   • .احسب هجوم @منشن`
            ], msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر احسب:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                `❌ حدث خطأ أثناء الحساب.`,
                `📌 حاول مرة أخرى لاحقاً.`
            ], msg);
        }
    }
};