// ايداع.js - إيداع نقاط في البنك (فائدة 35% يومياً)

const fs = require('fs');
const path = require('path');

// ========== المسارات ==========
const pointsPath = path.join(__dirname, 'db-points.json');
const bankPath = path.join(__dirname, 'db-bank.json');

// ========== التأكد من وجود الملفات والمجلدات ==========
if (!fs.existsSync(path.dirname(pointsPath))) fs.mkdirSync(path.dirname(pointsPath), { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(bankPath)) fs.writeFileSync(bankPath, JSON.stringify({}, null, 2));

// ========== دوال التحميل والحفظ ==========
function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; }
}
function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ========== إعدادات البنك ==========
const INTEREST_RATE = 0.35; // 35% يومياً

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
    const days = Math.floor(elapsed / (24 * 60 * 60 * 1000));
    if (days > 0 && data.deposit > 0) {
        let newDeposit = data.deposit;
        for (let i = 0; i < days; i++) {
            newDeposit = newDeposit * (1 + INTEREST_RATE);
        }
        newDeposit = Math.floor(newDeposit);
        const interestEarned = newDeposit - data.deposit;
        data.deposit = newDeposit;
        data.lastInterest += days * (24 * 60 * 60 * 1000);
        saveBankData(jid, data);
        return interestEarned;
    }
    return 0;
}

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `💰 إيـداع فـي الـبـنـك 💰\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;

    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: 'ايداع',
    category: 'عام',
    description: '💰 إيداع نقاط في البنك (فائدة 35% يومياً)',
    usage: '.ايداع [المبلغ]',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

        // استخراج المبلغ
        const fullText = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
        const args = fullText.split(/\s+/).slice(1);
        const amount = parseInt(args[0]);

        // التحقق من صحة المبلغ
        if (!amount || isNaN(amount) || amount <= 0) {
            await sendMessage(sock, chatId, [
                '❌ الرجاء إدخال مبلغ صحيح للإيداع.',
                '📌 مثال: .ايداع 100',
                '',
                '📈 *نظام الإيداع:*',
                '• إيداع نقاطك في البنك يحقق لك فائدة 35% يومياً.',
                '• يمكنك السحب في أي وقت باستخدام .سحب [المبلغ]'
            ], msg, [sender]);
            return;
        }

        // تحميل بيانات النقاط
        const points = loadJSON(pointsPath);
        const userPoints = points[sender] || 0;

        // التحقق من كفاية الرصيد
        if (userPoints < amount) {
            await sendMessage(sock, chatId, [
                `❌ رصيدك غير كافٍ.`,
                `💰 رصيدك الحالي: ${userPoints} نقطة`,
                `📌 المطلوب: ${amount} نقطة`,
                '',
                '📌 يمكنك كسب النقاط من الألعاب والفعاليات.'
            ], msg, [sender]);
            return;
        }

        // تطبيق الفائدة أولاً (لحساب الفوائد المستحقة قبل الإيداع)
        applyInterest(sender);

        // خصم النقاط وإضافة الوديعة
        points[sender] = userPoints - amount;
        saveJSON(pointsPath, points);

        const bankData = getBankData(sender);
        bankData.deposit += amount;
        // تحديث وقت آخر نشاط لبدء احتساب الفائدة من الآن
        bankData.lastInterest = Date.now();
        saveBankData(sender, bankData);

        // رسالة النجاح
        await sendMessage(sock, chatId, [
            `✅ تم إيداع ${amount} نقطة في البنك.`,
            `💰 رصيدك النقدي الآن: ${points[sender]} نقطة`,
            `🏦 الوديعة الحالية: ${bankData.deposit} نقطة`,
            `📈 ستبدأ الفائدة من الآن بنسبة ${Math.round(INTEREST_RATE * 100)}% يومياً.`,
            '',
            `📌 استخدم .سحب [المبلغ] لسحب نقاطك`,
            `📌 استخدم .بنك لعرض حالتك المالية`
        ], msg, [sender]);
    }
};