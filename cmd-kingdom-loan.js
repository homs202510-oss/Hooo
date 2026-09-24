// سلفني.js - نظام استلاف النقاط مع غرامات تلقائية (نسخة محسنة ومتوافقة مع النظام الجديد)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const loansPath = path.join(__dirname, 'db-loans.json');
const kingdomPath = path.join(__dirname, 'db-kingdom.json');

// التأكد من وجود الملفات والمجلدات
if (!fs.existsSync(path.dirname(pointsPath))) fs.mkdirSync(path.dirname(pointsPath), { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(loansPath)) fs.writeFileSync(loansPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(kingdomPath)) fs.writeFileSync(kingdomPath, JSON.stringify({}, null, 2));

// ========== دوال JSON المحسّنة ==========
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
function getRepaymentHours(loanAmount) {
    if (loanAmount <= 100) return 2;
    if (loanAmount <= 500) return 12;
    if (loanAmount <= 1000) return 20;
    if (loanAmount <= 5000) return 36;
    if (loanAmount <= 10000) return 48;
    if (loanAmount <= 50000) return 72;
    return 120;
}

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

// ========== تطبيق الغرامات التلقائية ==========
function applyAutoPenalties() {
    const loans = loadJSON(loansPath);
    const points = loadJSON(pointsPath);
    let updated = 0;
    let penaltiesApplied = [];

    for (const [jid, loan] of Object.entries(loans)) {
        if (loan.remaining <= 0) continue;
        
        const overdueHours = getOverdueHours(loan.dueDate);
        if (overdueHours > 0) {
            const penaltyPerHour = loan.dailyPenalty || getHourlyPenalty(loan.amount);
            const totalPenalty = overdueHours * penaltyPerHour;
            
            loan.remaining += totalPenalty;
            
            const currentPoints = points[jid] || 0;
            let deducted = 0;
            
            if (currentPoints > 0) {
                deducted = Math.min(totalPenalty, currentPoints);
                points[jid] = currentPoints - deducted;
                
                if (overdueHours >= 24) {
                    const extraDeduction = Math.min(totalPenalty, points[jid] || 0);
                    if (extraDeduction > 0) {
                        points[jid] -= extraDeduction;
                        deducted += extraDeduction;
                    }
                }
            }
            
            if (deducted < totalPenalty) {
                const remainingPenalty = totalPenalty - deducted;
                const bonusPenalty = Math.floor(loan.amount / 2);
                loan.remaining += remainingPenalty + bonusPenalty;
            }
            
            loan.remaining = Math.floor(loan.remaining);
            
            penaltiesApplied.push({
                jid: jid,
                penalty: totalPenalty,
                deducted: deducted,
                newRemaining: loan.remaining,
                overdueHours: overdueHours
            });
            updated++;
        }
    }

    if (updated > 0) {
        saveJSON(pointsPath, points);
        saveJSON(loansPath, loans);
    }

    return { updated, penaltiesApplied };
}

// ========== دالة استخراج النص ==========
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

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `💰 نـظـام الـسـلـف 💰\n`;
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
    command: 'سلفني',
    category: 'مملكة',
    description: '💰 استلاف نقاط من البوت (مهلة بالساعات، خصم تلقائي)',
    usage: '.سلفني [المبلغ]',
    example: '.سلفني 100',
    
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            // ===== تحديث بيانات المستخدم وتصحيحها =====
            const kingdomData = loadJSON(kingdomPath);
            let user = kingdomData[sender];
            if (user) {
                user = sanitizeUser(user);
                kingdomData[sender] = user;
                saveJSON(kingdomPath, kingdomData);
            }

            // ===== تطبيق الغرامات التلقائية قبل أي إجراء =====
            applyAutoPenalties();

            const fullText = getMessageText(msg);
            const args = fullText.trim().split(/\s+/).slice(1);
            const amount = parseInt(args[0]);

            // ===== عرض التعليمات =====
            if (!amount || isNaN(amount) || amount <= 0) {
                const lines = [
                    '❌ الرجاء إدخال مبلغ صحيح.',
                    '📝 مثال: .سلفني 100',
                    '',
                    '💰 *سياسة السلف (بالساعات):*',
                    '📌 كل 1 نقطة = تستلف 3 نقاط فقط',
                    `📌 مدة السداد حسب المبلغ:`,
                    `   • 100 نقطة → 2 ساعة`,
                    `   • 500 نقطة → 12 ساعة`,
                    `   • 1000 نقطة → 20 ساعة`,
                    `   • 10000 نقطة → 48 ساعة`,
                    '📌 غرامة التأخير لكل ساعة (حسب المبلغ)',
                    '⛔ إذا لم يكفي الرصيد، يزداد الدين بنصف المبلغ',
                    '⛔ التأخير 24 ساعة = مضاعفة الدين'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // ===== تحميل البيانات =====
            const points = loadJSON(pointsPath);
            const loans = loadJSON(loansPath);
            const userPoints = points[sender] || 0;

            // ===== التحقق من وجود دين سابق =====
            if (loans[sender] && loans[sender].remaining > 0) {
                const loan = loans[sender];
                const overdueHours = getOverdueHours(loan.dueDate);
                
                if (overdueHours > 0) {
                    const lines = [
                        '⛔ *تم تجميد حسابك!*',
                        '❌ لديك دين متأخر!',
                        `📊 المتبقي: ${loan.remaining} نقطة`,
                        `📅 تاريخ الاستحقاق: ${formatDate(loan.dueDate)}`,
                        `⏳ متأخر ${overdueHours} ساعة`,
                        `⚠️ الغرامة لكل ساعة: ${loan.dailyPenalty || getHourlyPenalty(loan.amount)} نقطة`,
                        '',
                        '🚫 لا يمكنك الاستلاف حتى تسدد كامل دينك!',
                        '📌 استخدم .سداد فوراً'
                    ];
                    await sendMessage(sock, chatId, lines, msg, [sender]);
                    return;
                }
                
                const lines = [
                    '❌ لديك دين سابق غير مسدد!',
                    `📊 المتبقي: ${loan.remaining} نقطة`,
                    `📅 تاريخ الاستحقاق: ${formatDate(loan.dueDate)}`,
                    '📌 استخدم .سداد للمبلغ',
                    '📝 مثال: .سداد 5'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // ===== حساب الحد الأقصى للسلف =====
            const maxLoan = userPoints * 3;
            if (amount > maxLoan) {
                const lines = [
                    `❌ لا يمكنك استلاف أكثر من ${maxLoan} نقطة`,
                    `📊 رصيدك الحالي: ${userPoints} نقطة`,
                    `📌 كل 1 نقطة = تستلف 3 نقاط فقط`
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            if (amount < 10) {
                const lines = [
                    '❌ الحد الأدنى للسلف 10 نقاط',
                    '📌 حاول بمبلغ أكبر'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // ===== إنشاء القرض =====
            const hours = getRepaymentHours(amount);
            const dueDate = new Date(Date.now() + hours * 60 * 60 * 1000);

            loans[sender] = {
                amount: amount,
                remaining: amount,
                dueDate: dueDate.toISOString(),
                dailyPenalty: getHourlyPenalty(amount),
                loanDate: new Date().toISOString(),
                freeze: false
            };

            points[sender] = userPoints + amount;
            saveJSON(pointsPath, points);
            saveJSON(loansPath, loans);

            // تحديث lastActive للمستخدم (إذا كان لديه مملكة)
            if (user) {
                user.lastActive = Date.now();
                kingdomData[sender] = user;
                saveJSON(kingdomPath, kingdomData);
            }

            // ===== رسالة النجاح =====
            const lines = [
                `✅ تم استلاف ${amount} نقطة`,
                `💰 رصيدك الآن: ${points[sender]} نقطة`,
                `📅 تاريخ الاستحقاق: ${formatDate(dueDate)}`,
                `⏳ مدة السداد: ${hours} ساعة`,
                `⚠️ غرامة التأخير لكل ساعة: ${getHourlyPenalty(amount)} نقطة`,
                `⛔ إذا لم يكفي الرصيد عند التأخير، يزداد الدين بنصف المبلغ`,
                `⛔ التأخير 24 ساعة = مضاعفة الدين`,
                '',
                '📌 استخدم .سداد قبل انتهاء المدة!'
            ];
            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر سلفني:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};