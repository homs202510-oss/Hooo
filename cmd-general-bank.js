// بنك.js - عرض الحالة المالية الكاملة (الرصيد، الوديعة، القروض، الفوائد) - نسخة متوافقة مع نظام التخزين المنفصل
const fs = require('fs');
const path = require('path');

// ========== المسارات ==========
const pointsPath = path.join(__dirname, 'db-points.json');
const loansPath = path.join(__dirname, 'db-loans.json');
const bankPath = path.join(__dirname, 'db-bank.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const ACTIVE_PATH = path.join(dataDir, 'kd-active.json');

// ===== التأكد من وجود جميع الملفات =====
const allPaths = [MAIN_PATH, ACTIVE_PATH];
for (const p of allPaths) {
    if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(loansPath)) fs.writeFileSync(loansPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(bankPath)) fs.writeFileSync(bankPath, JSON.stringify({}, null, 2));

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

// ========== إعدادات البنك ==========
const INTEREST_RATE = 0.35; // 35% يومياً
const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 ساعة

// ========== تنسيق الأرقام ==========
function formatPoints(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    num = Math.floor(num);
    if (num >= 1e15) return '∞';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + ' تريليون';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + ' مليار';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + ' مليون';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + ' ألف';
    return num.toString();
}

// ========== دوال البنك ==========
function getBankData(jid) {
    const bank = loadJSON(bankPath);
    if (!bank[jid]) {
        bank[jid] = { deposit: 0, lastInterest: Date.now() };
        saveJSON(bankPath, bank);
    }
    return bank[jid];
}

function saveBankData(jid, data) {
    const bank = loadJSON(bankPath);
    bank[jid] = data;
    saveJSON(bankPath, bank);
}

// تطبيق الفائدة على الوديعة (ترجع قيمة الفائدة المضافة)
function applyInterest(jid) {
    const bank = loadJSON(bankPath);
    if (!bank[jid]) return 0;
    const data = bank[jid];
    const now = Date.now();
    const elapsed = now - data.lastInterest;
    const days = Math.floor(elapsed / INTERVAL_MS);
    if (days > 0 && data.deposit > 0) {
        let newDeposit = data.deposit;
        for (let i = 0; i < days; i++) {
            newDeposit = newDeposit * (1 + INTEREST_RATE);
        }
        newDeposit = Math.floor(newDeposit);
        const interestEarned = newDeposit - data.deposit;
        data.deposit = newDeposit;
        data.lastInterest += days * INTERVAL_MS;
        saveBankData(jid, data);
        return interestEarned;
    }
    return 0;
}

// ========== دوال مساعدة للقروض ==========
function getHourlyPenalty(amount) {
    if (amount <= 100) return 1;
    if (amount <= 500) return 2;
    if (amount <= 1000) return 3;
    if (amount <= 5000) return 5;
    if (amount <= 10000) return 10;
    if (amount <= 50000) return 20;
    return 50;
}

function formatDate(d) {
    const dt = new Date(d);
    return `${dt.getDate()}/${dt.getMonth()+1}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
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

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🏦 بـنـك الـمـمـلـكـة 🏦\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['بنك', 'حسابي'],
    category: 'عام',
    description: '🏦 عرض الحالة المالية الكاملة (الرصيد، الوديعة، القروض، الفوائد)',
    usage: '.بنك',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
            const senderNum = sender.split('@')[0];

            // ===== تصحيح بيانات المستخدم (إن وجدت مملكة) =====
            if (userExists(sender)) {
                let user = loadUserData(sender);
                user = sanitizeUser(user);
                saveUserData(sender, user);
            }

            // تطبيق الفائدة أولاً
            const interestEarned = applyInterest(sender);
            const bankData = getBankData(sender);
            const points = loadJSON(pointsPath);
            const loans = loadJSON(loansPath);

            const userPoints = points[sender] || 0;
            const loan = loans[sender];
            const deposit = bankData.deposit;

            // بناء الرسالة
            const lines = [
                `👤 @${senderNum}`,
                '',
                `💰 *الرصيد النقدي:* ${formatPoints(userPoints)} نقطة`,
                `🏦 *الوديعة في البنك:* ${formatPoints(deposit)} نقطة`,
                `📈 *نسبة الفائدة:* ${Math.round(INTEREST_RATE * 100)}% يومياً`,
                interestEarned > 0 ? `✨ *آخر أرباح:* +${formatPoints(interestEarned)} نقطة` : '',
                `⏰ *آخر تحديث:* ${formatDate(bankData.lastInterest)}`,
            ].filter(Boolean);

            // معلومات القرض
            if (loan && loan.remaining > 0) {
                const overdueHours = getOverdueHours(loan.dueDate);
                const remainingHours = getRemainingHours(loan.dueDate);
                let statusMsg = overdueHours > 0 
                    ? `🔴 متأخر ${overdueHours} ساعة` 
                    : `🟢 متبقي ${remainingHours} ساعة`;
                lines.push('');
                lines.push('📊 *حالة القرض:*');
                lines.push(`   📉 المتبقي: ${formatPoints(loan.remaining)} نقطة`);
                lines.push(`   📅 الاستحقاق: ${formatDate(loan.dueDate)}`);
                lines.push(`   ⏳ الحالة: ${statusMsg}`);
                lines.push(`   ⚠️ الغرامة/ساعة: ${loan.dailyPenalty || getHourlyPenalty(loan.amount)} نقطة`);
            } else {
                lines.push('');
                lines.push('✅ لا يوجد لديك قروض.');
            }

            // تعليمات
            lines.push('');
            lines.push('📌 *الأوامر المتاحة:*');
            lines.push('   • `.ايداع [المبلغ]` – إيداع نقاط في البنك (فائدة 35% يومياً)');
            lines.push('   • `.سحب [المبلغ]` – سحب نقاط من البنك');
            lines.push('   • `.سلفني [المبلغ]` – استلاف نقاط (قرض بفائدة)');
            lines.push('   • `.سداد` – عرض حالة القرض وسداد جزء منه');
            lines.push('   • `.بنك` – عرض هذه المعلومات');

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('❌ خطأ في أمر بنك:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};