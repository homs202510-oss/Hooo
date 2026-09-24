// سداد.js - نظام سداد الديون (نسخة محسنة ومتوافقة مع النظام الجديد)
const fs = require('fs');
const path = require('path');
const hay = require('./lib-roles');

// ========== المسارات ==========
const pointsPath = path.join(__dirname, 'db-points.json');
const loansPath = path.join(__dirname, 'db-loans.json');
const bankPath = path.join(__dirname, 'db-bank.json');
const kingdomPath = path.join(__dirname, 'db-kingdom.json');

// ========== التأكد من وجود الملفات ==========
if (!fs.existsSync(path.dirname(pointsPath))) fs.mkdirSync(path.dirname(pointsPath), { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(loansPath)) fs.writeFileSync(loansPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(bankPath)) fs.writeFileSync(bankPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(kingdomPath)) fs.writeFileSync(kingdomPath, JSON.stringify({}, null, 2));

// ========== دوال التحميل والحفظ المحسّنة ==========
function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; }
}
function saveJSON(file, data) {
    try {
        if (fs.existsSync(file)) {
            fs.writeFileSync(file + '.bak', fs.readFileSync(file));
        }
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('❌ فشل حفظ الملف:', file, e.message);
        return false;
    }
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

// ========== دوال مساعدة ==========
function getHourlyPenalty(loanAmount) {
    if (loanAmount <= 100) return 1;
    if (loanAmount <= 500) return 2;
    if (loanAmount <= 1000) return 3;
    if (loanAmount <= 5000) return 5;
    if (loanAmount <= 10000) return 10;
    if (loanAmount <= 50000) return 20;
    return 50;
}

function formatDate(date) {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getOverdueHours(dueDate) {
    const now = Date.now();
    const due = new Date(dueDate).getTime();
    const diff = now - due;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60));
}

function getRemainingHours(dueDate) {
    const now = Date.now();
    const due = new Date(dueDate).getTime();
    const diff = due - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60));
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `💰 نـظـام الـسـداد 💰\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== تطبيق السداد الكامل ==========
function applyFullRepayment() {
    const loans = loadJSON(loansPath);
    const points = loadJSON(pointsPath);
    const bank = loadJSON(bankPath);
    let updated = 0;
    let results = [];

    for (const [jid, loan] of Object.entries(loans)) {
        if (loan.remaining <= 0) continue;
        
        const debtAmount = loan.remaining;
        const currentPoints = points[jid] || 0;
        const currentDeposit = bank[jid]?.deposit || 0;
        
        let deducted = 0;
        let deductedFromPoints = 0;
        let deductedFromDeposit = 0;
        let remainingDebt = debtAmount;
        
        if (currentPoints > 0) {
            if (currentPoints >= remainingDebt) {
                deductedFromPoints = remainingDebt;
                points[jid] = currentPoints - remainingDebt;
                remainingDebt = 0;
            } else {
                deductedFromPoints = currentPoints;
                points[jid] = 0;
                remainingDebt -= currentPoints;
            }
        }
        
        if (remainingDebt > 0 && currentDeposit > 0) {
            if (currentDeposit >= remainingDebt) {
                deductedFromDeposit = remainingDebt;
                bank[jid].deposit = currentDeposit - remainingDebt;
                remainingDebt = 0;
            } else {
                deductedFromDeposit = currentDeposit;
                bank[jid].deposit = 0;
                remainingDebt -= currentDeposit;
            }
        }
        
        deducted = deductedFromPoints + deductedFromDeposit;
        
        if (remainingDebt > 0) {
            loan.remaining = remainingDebt;
        } else {
            loan.remaining = 0;
            delete loans[jid];
        }
        
        const overdueHours = getOverdueHours(loan.dueDate);
        let penalty = 0;
        if (overdueHours > 0 && loan.remaining > 0) {
            const penaltyPerHour = loan.dailyPenalty || getHourlyPenalty(loan.amount);
            penalty = overdueHours * penaltyPerHour;
            loan.remaining += penalty;
        }
        
        results.push({
            jid: jid,
            debtAmount: debtAmount,
            deducted: deducted,
            deductedFromPoints: deductedFromPoints,
            deductedFromDeposit: deductedFromDeposit,
            newRemaining: loan.remaining || 0,
            newPoints: points[jid] || 0,
            newDeposit: bank[jid]?.deposit || 0,
            isFullyPaid: loan.remaining <= 0,
            penalty: penalty,
            overdueHours: overdueHours
        });
        updated++;
    }

    if (updated > 0) {
        saveJSON(pointsPath, points);
        saveJSON(loansPath, loans);
        saveJSON(bankPath, bank);
    }

    return { updated, results };
}

// ========== عرض جميع المديونين ==========
async function showAllDebts(sock, chatId, quoted = null) {
    const loans = loadJSON(loansPath);
    const points = loadJSON(pointsPath);
    const bank = loadJSON(bankPath);
    const entries = Object.entries(loans);

    if (entries.length === 0) {
        await sendMessage(sock, chatId, [
            '📊 لا يوجد ديون مسجلة حالياً.'
        ], quoted);
        return;
    }

    let lines = ['📊 قائمة المديونين', ''];
    let mentions = [];
    let totalDebt = 0;
    let totalRemaining = 0;

    for (const [jid, loan] of entries) {
        if (loan.remaining <= 0) continue;
        
        const overdueHours = getOverdueHours(loan.dueDate);
        let status = overdueHours > 0 ? `🔴 متأخر ${overdueHours} ساعة` : '🟢 في المدة';
        const paidPercent = loan.amount > 0 ? Math.floor(((loan.amount - loan.remaining) / loan.amount) * 100) : 0;
        const userPoints = points[jid] || 0;
        const userDeposit = bank[jid]?.deposit || 0;
        
        totalDebt += loan.amount;
        totalRemaining += loan.remaining;
        
        lines.push(`👤 @${jid.split('@')[0]}`);
        lines.push(`   💰 المبلغ: ${loan.amount} نقطة`);
        lines.push(`   📉 المتبقي: ${loan.remaining} نقطة (${paidPercent}%)`);
        lines.push(`   💰 الرصيد: ${userPoints} نقطة`);
        lines.push(`   🏦 الوديعة: ${userDeposit} نقطة`);
        lines.push(`   ⏱ غرامة/ساعة: ${loan.dailyPenalty} نقطة`);
        lines.push(`   📅 الاستحقاق: ${formatDate(loan.dueDate)}`);
        lines.push(`   ⏳ الحالة: ${status}`);
        lines.push('');
        mentions.push(jid);
    }

    const totalPaidPercent = totalDebt > 0 ? Math.floor(((totalDebt - totalRemaining) / totalDebt) * 100) : 0;
    lines.push(`📊 إجمالي الديون: ${totalDebt} نقطة`);
    lines.push(`📉 إجمالي المتبقي: ${totalRemaining} نقطة (${totalPaidPercent}%)`);

    await sendMessage(sock, chatId, lines, quoted, mentions);
}

// ========== تطبيق السداد الكامل ==========
async function applyFull(sock, chatId, quoted = null) {
    const result = applyFullRepayment();
    const { updated, results } = result;

    if (updated === 0) {
        await sendMessage(sock, chatId, [
            '✅ لا توجد ديون للسداد الكامل.'
        ], quoted);
        return;
    }

    let lines = [`✅ تم تطبيق السداد الكامل على ${updated} دين`];
    lines.push('💰 تم خصم كل المبلغ المستحق');
    lines.push('');
    
    for (const r of results) {
        lines.push(`👤 @${r.jid.split('@')[0]}`);
        lines.push(`   📊 المبلغ المستحق: ${r.debtAmount} نقطة`);
        
        if (r.deductedFromPoints > 0) {
            lines.push(`   💰 خصم من الرصيد: ${r.deductedFromPoints} نقطة`);
        }
        if (r.deductedFromDeposit > 0) {
            lines.push(`   🏦 خصم من الإيداع: ${r.deductedFromDeposit} نقطة`);
        }
        if (r.penalty > 0) {
            lines.push(`   ⚠️ غرامة تأخير: ${r.penalty} نقطة`);
        }
        
        lines.push(`   💰 الرصيد الحالي: ${r.newPoints} نقطة`);
        lines.push(`   🏦 الإيداع الحالي: ${r.newDeposit} نقطة`);
        
        if (r.isFullyPaid) {
            lines.push(`   🎉 تم سداد الدين بالكامل!`);
        } else {
            lines.push(`   📉 المتبقي: ${r.newRemaining} نقطة`);
        }
        lines.push('');
    }

    const mentions = results.map(r => r.jid);
    await sendMessage(sock, chatId, lines, quoted, mentions);
}

// ========== استخراج المنشن ==========
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
    command: 'سداد',
    category: 'مملكة',
    description: '💰 نظام سداد الديون',
    usage: '.سداد [مبلغ] | .سداد @منشن [مبلغ]',
    
    async execute(sock, m) {
        try {
            const chatId = m.key.remoteJid;
            const sender = m.key.participant || m.key.remoteJid;

            // ===== تحديث بيانات المستخدم وتصحيحها =====
            const kingdomData = loadJSON(kingdomPath);
            let user = kingdomData[sender];
            if (user) {
                user = sanitizeUser(user);
                kingdomData[sender] = user;
                saveJSON(kingdomPath, kingdomData);
            }

            const body = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
            const args = body.split(/\s+/).slice(1);
            const command = args[0] || '';

            const mentionedJids = extractMentions(m);
            const quotedSender = m.message?.extendedTextMessage?.contextInfo?.participant || null;

            // =====================================================
            // 1. عرض شرح طريقة الاستخدام (.سداد)
            // =====================================================
            if (command === '' || command === 'help' || command === 'شرح') {
                const loans = loadJSON(loansPath);
                const userLoan = loans[sender];
                const points = loadJSON(pointsPath);
                const bank = loadJSON(bankPath);
                const userPoints = points[sender] || 0;
                const userDeposit = bank[sender]?.deposit || 0;
                
                let debtInfo = [];
                if (userLoan && userLoan.remaining > 0) {
                    const overdueHours = getOverdueHours(userLoan.dueDate);
                    const status = overdueHours > 0 ? `🔴 متأخر ${overdueHours} ساعة` : '🟢 في المدة';
                    debtInfo = [
                        '',
                        '📊 *حالة دينك:*',
                        `💰 المتبقي: ${userLoan.remaining} نقطة`,
                        `⏳ ${status}`,
                    ];
                }
                
                const lines = [
                    '📖 *شرح أوامر السداد*',
                    '',
                    '📌 .سداد - يعرض هذا الشرح',
                    '📌 .سداد 5 - يسدد 5 نقاط من دينك',
                    '📌 .سداد @منشن 5 - يسدد دين الشخص الممنشن',
                    '📌 .سداد عرض - للمطورين (عرض المديونين)',
                    '📌 .سداد طبق - للمطورين (سداد كل الديون)',
                    '',
                    '💰 *رصيدك:*',
                    `💰 نقاط: ${userPoints} نقطة`,
                    `🏦 وديعة: ${userDeposit} نقطة`,
                    ...debtInfo,
                    '',
                    '📌 لعرض معلوماتك المالية: .بنك',
                    '📌 للاستلاف: .سلفني [المبلغ]',
                    '📌 للإيداع: .ايداع [المبلغ]',
                    '📌 للسحب: .سحب [المبلغ]'
                ];
                await sendMessage(sock, chatId, lines, m, [sender]);
                return;
            }

            // =====================================================
       // 2. عرض جميع المديونين (.سداد عرض)
            // =====================================================
            if (command === 'عرض') {
                const senderLid = hay.toLid(sender);
                if (hay.isFounder(senderLid) || hay.isOwnerbot(senderLid) || hay.isDeveloper(senderLid)) {
                    return await showAllDebts(sock, chatId, m);
                } else {
                    const points = loadJSON(pointsPath);
                    const bank = loadJSON(bankPath);
                    const userPoints = points[sender] || 0;
                    const userDeposit = bank[sender]?.deposit || 0;
                    const loans = loadJSON(loansPath);
                    const loan = loans[sender];
                    
                    let debtInfo = [];
                    if (loan && loan.remaining > 0) {
                        const overdueHours = getOverdueHours(loan.dueDate);
                        const status = overdueHours > 0 ? `🔴 متأخر ${overdueHours} ساعة` : '🟢 في المدة';
                        debtInfo = [
                            '',
                            '📊 *حالة دينك:*',
                            `💰 المتبقي: ${loan.remaining} نقطة`,
                            `⏳ ${status}`,
                            `📅 الاستحقاق: ${formatDate(loan.dueDate)}`,
                        ];
                    }
                    
                    return sendMessage(sock, chatId, [
                        '🏦 *معلوماتك المالية*',
                        '',
                        `👤 @${sender.split('@')[0]}`,
                        `💰 رصيدك: ${userPoints} نقطة`,
                        `🏦 وديعتك: ${userDeposit} نقطة`,
                        ...debtInfo,
                        '',
                        '📌 .بنك - لعرض معلوماتك الكاملة',
                        '📌 .سداد [مبلغ] - لسداد دينك'
                    ], m, [sender]);
                }
            }

            // =====================================================
            // 3. تطبيق السداد الكامل (.سداد طبق)
            // =====================================================
            if (command === 'طبق') {
                const senderLid = hay.toLid(sender);
                if (!(hay.isFounder(senderLid) || hay.isOwnerbot(senderLid) || hay.isDeveloper(senderLid))) {
                    return sendMessage(sock, chatId, [
                        '❌ هذا الأمر مخصص للمطورين فقط.'
                    ], m);
                }
                return await applyFull(sock, chatId, m);
            }

            // =====================================================
            // 4. سداد دين شخص آخر (.سداد @منشن 5)
            // =====================================================
            if (mentionedJids.length > 0 || quotedSender) {
                const target = mentionedJids.length > 0 ? mentionedJids[0] : quotedSender;
                
                const amount = parseInt(args[1] || args[0]);
                if (!isNaN(amount) && amount > 0) {
                    const loans = loadJSON(loansPath);
                    const points = loadJSON(pointsPath);

                    if (!loans[target] || loans[target].remaining <= 0) {
                        return sendMessage(sock, chatId, [
                            `✅ @${target.split('@')[0]} ليس لديه ديون.`
                        ], m, [target]);
                    }

                    const loan = loans[target];
                    const payAmount = Math.min(amount, loan.remaining);
                    
                    const senderPoints = points[sender] || 0;
                    if (senderPoints < payAmount) {
                        return sendMessage(sock, chatId, [
                            `❌ رصيدك غير كافٍ (${senderPoints} نقطة)`,
                            `📌 المطلوب: ${payAmount} نقطة`
                        ], m, [sender]);
                    }

                    points[sender] = senderPoints - payAmount;
                    loan.remaining -= payAmount;

                    let msg = `✅ تم سداد ${payAmount} نقطة من دين @${target.split('@')[0]}!`;
                    let extraMsg = '';

                    if (loan.remaining <= 0) {
                        delete loans[target];
                        extraMsg = '🎉 تم سداد الدين بالكامل!';
                    } else {
                        const paidPercent = loan.amount > 0 ? Math.floor(((loan.amount - loan.remaining) / loan.amount) * 100) : 0;
                        extraMsg = `📉 المتبقي: ${loan.remaining} نقطة (${paidPercent}%)`;
                    }

                    saveJSON(pointsPath, points);
                    saveJSON(loansPath, loans);

                    // تحديث lastActive للمستخدمين
                    const kingdomData2 = loadJSON(kingdomPath);
                    let userTarget = kingdomData2[target];
                    if (userTarget) {
                        userTarget.lastActive = Date.now();
                        kingdomData2[target] = userTarget;
                        saveJSON(kingdomPath, kingdomData2);
                    }
                    let userSender = kingdomData2[sender];
                    if (userSender) {
                        userSender.lastActive = Date.now();
                        kingdomData2[sender] = userSender;
                        saveJSON(kingdomPath, kingdomData2);
                    }

                    await sendMessage(sock, chatId, [
                        msg,
                        `💰 رصيدك المتبقي: ${points[sender]} نقطة`,
                        extraMsg
                    ], m, [sender, target]);
                    return;
                }

                // عرض دين الشخص
                const loans = loadJSON(loansPath);
                const loan = loans[target];
                if (!loan || loan.remaining <= 0) {
                    return sendMessage(sock, chatId, [
                        `✅ @${target.split('@')[0]} ليس لديه ديون.`
                    ], m, [target]);
                }
                
                const overdueHours = getOverdueHours(loan.dueDate);
                const remainingHours = getRemainingHours(loan.dueDate);
                const paidPercent = loan.amount > 0 ? Math.floor(((loan.amount - loan.remaining) / loan.amount) * 100) : 0;
                const points = loadJSON(pointsPath);
                const bank = loadJSON(bankPath);
                const userPoints = points[target] || 0;
                const userDeposit = bank[target]?.deposit || 0;
                
                let statusMsg = overdueHours > 0 ? `🔴 متأخر ${overdueHours} ساعة` : `🟢 متبقي ${remainingHours} ساعة`;
                
                return sendMessage(sock, chatId, [
                    `📊 ديون @${target.split('@')[0]}`,
                    `💰 المبلغ الأصلي: ${loan.amount} نقطة`,
                    `📉 المتبقي: ${loan.remaining} نقطة (${paidPercent}%)`,
                    `🏦 وديعته: ${userDeposit} نقطة`,
                    `⏱ غرامة/ساعة: ${loan.dailyPenalty} نقطة`,
                    `📅 الاستحقاق: ${formatDate(loan.dueDate)}`,
                    `⏳ الحالة: ${statusMsg}`,
                    '',
                    `📌 .سداد @${target.split('@')[0]} [مبلغ]`
                ], m, [target]);
            }

            // =====================================================
            // 5. سداد دين النفس (.سداد 5)
            // =====================================================
            const amount = parseInt(command);
            if (!isNaN(amount) && amount > 0) {
                const loans = loadJSON(loansPath);
                const points = loadJSON(pointsPath);
                const bank = loadJSON(bankPath);

                if (!loans[sender] || loans[sender].remaining <= 0) {
                    return sendMessage(sock, chatId, [
                        '✅ ليس لديك أي ديون مسجلة.'
                    ], m, [sender]);
                }

                const loan = loans[sender];
                const userPoints = points[sender] || 0;
                const userDeposit = bank[sender]?.deposit || 0;

                const payAmount = Math.min(amount, loan.remaining);

                if (userPoints < payAmount) {
                    return sendMessage(sock, chatId, [
                        `❌ رصيدك غير كافٍ (${userPoints} نقطة)`,
                        `💰 رصيدك: ${userPoints} نقطة`,
                        `🏦 وديعتك: ${userDeposit} نقطة`,
                        `📌 المطلوب: ${payAmount} نقطة`,
                        `📌 يمكنك سحب من البنك بـ .سحب ${payAmount - userPoints}`
                    ], m, [sender]);
                }

                points[sender] = userPoints - payAmount;
                loan.remaining -= payAmount;

                let msg = `✅ تم سداد ${payAmount} نقطة بنجاح!`;
                let extraMsg = '';

                if (loan.remaining <= 0) {
                    delete loans[sender];
                    extraMsg = '🎉 تهانينا! تم سداد الدين بالكامل!';
                } else {
                    const paidPercent = loan.amount > 0 ? Math.floor(((loan.amount - loan.remaining) / loan.amount) * 100) : 0;
                    extraMsg = `📉 المتبقي: ${loan.remaining} نقطة (${paidPercent}%)`;
                }

                saveJSON(pointsPath, points);
                saveJSON(loansPath, loans);

                // تحديث lastActive
                const kingdomData3 = loadJSON(kingdomPath);
                let userSelf = kingdomData3[sender];
                if (userSelf) {
                    userSelf.lastActive = Date.now();
                    kingdomData3[sender] = userSelf;
                    saveJSON(kingdomPath, kingdomData3);
                }

                await sendMessage(sock, chatId, [
                    msg,
                    `💰 رصيدك المتبقي: ${points[sender]} نقطة`,
                    extraMsg
                ], m, [sender]);
                return;
            }

            // =====================================================
            // 6. أمر غير معروف
            // =====================================================
            const points = loadJSON(pointsPath);
            const bank = loadJSON(bankPath);
            const loans = loadJSON(loansPath);
            const userPoints = points[sender] || 0;
            const userDeposit = bank[sender]?.deposit || 0;
            const userLoan = loans[sender];
            
            let debtInfo = [];
            if (userLoan && userLoan.remaining > 0) {
                const overdueHours = getOverdueHours(userLoan.dueDate);
                const status = overdueHours > 0 ? `🔴 متأخر ${overdueHours} ساعة` : '🟢 في المدة';
                debtInfo = [
                    '',
                    '📊 *حالة دينك:*',
                    `💰 المتبقي: ${userLoan.remaining} نقطة`,
                    `⏳ ${status}`,
                ];
            }
            
            await sendMessage(sock, chatId, [
                '📖 *أوامر السداد المتاحة*',
                '',
                '📌 .سداد - شرح طريقة الاستخدام',
                '📌 .سداد 5 - يسدد 5 نقاط من دينك',
                '📌 .سداد @منشن 5 - يسدد دين الشخص',
                '',
                '💰 *رصيدك:*',
                `💰 نقاط: ${userPoints} نقطة`,
                `🏦 وديعة: ${userDeposit} نقطة`,
                ...debtInfo,
                '',
                '📌 لعرض معلوماتك الكاملة: .بنك'
            ], m, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر سداد:', error);
            await sendMessage(sock, m.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], m);
        }
    },
    
    // =====================================================
    // دالة التذكير التلقائي
    // =====================================================
    async reminder(sock) {
        try {
            const loans = loadJSON(loansPath);
            const entries = Object.entries(loans);
            
            if (entries.length === 0) return { sent: 0, message: 'لا يوجد مديونون' };
            
            let sent = 0;
            
            for (const [jid, loan] of entries) {
                if (loan.remaining <= 0) continue;
                
                const points = loadJSON(pointsPath);
                const bank = loadJSON(bankPath);
                const userPoints = points[jid] || 0;
                const userDeposit = bank[jid]?.deposit || 0;
                const overdueHours = getOverdueHours(loan.dueDate);
                const remainingHours = getRemainingHours(loan.dueDate);
                const paidPercent = loan.amount > 0 ? Math.floor(((loan.amount - loan.remaining) / loan.amount) * 100) : 0;
                
                let statusMsg = '';
                let warning = '';
                if (overdueHours > 0) {
                    statusMsg = `🔴 متأخر ${overdueHours} ساعة`;
                    warning = '⚠️ *تنبيه:* دينك يزداد بالغرامات كل ساعة تأخير!';
                } else {
                    statusMsg = `🟢 متبقي ${remainingHours} ساعة`;
                    if (remainingHours <= 24) {
                        warning = '⚠️ *تنبيه:* موعد الاستحقاق قريب!';
                    }
                }
                
                const dailyAmount = Math.max(5, Math.floor(loan.amount * 0.05));
                
                const lines = [
                    '📢 *تذكير بسداد الدين*',
                    '',
                    `👤 @${jid.split('@')[0]}`,
                    `💰 المبلغ الأصلي: ${loan.amount} نقطة`,
                    `📉 المتبقي: ${loan.remaining} نقطة (${paidPercent}%)`,
                    `💰 رصيدك: ${userPoints} نقطة`,
                    `🏦 وديعتك: ${userDeposit} نقطة`,
                    `⏱ غرامة/ساعة: ${loan.dailyPenalty} نقطة`,
                    `📆 الخصم الموصى به: ${dailyAmount} نقطة`,
                    `📅 الاستحقاق: ${formatDate(loan.dueDate)}`,
                    `⏳ الحالة: ${statusMsg}`,
                    warning,
                    '',
                    `📌 استخدم .سداد ${dailyAmount} للسداد`,
                    `📌 أو .سداد @${jid.split('@')[0]} ${dailyAmount} لشخص آخر`,
                    `📌 عرض معلوماتك: .بنك`
                ];
                
                try {
                    await sendMessage(sock, jid, lines, null, [jid]);
                    sent++;
                } catch (e) {
                    console.log(`❌ فشل إرسال تذكير لـ ${jid}`);
                }
            }
            
            return { 
                sent, 
                message: `✅ تم إرسال تذكير لـ ${sent} مديون`
            };
        } catch (error) {
            console.error('✗ خطأ في التذكير:', error);
            return { sent: 0, message: '❌ حدث خطأ في التذكير' };
        }
    }
};