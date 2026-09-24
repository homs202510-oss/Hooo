// سحب.js - سحب نقاط من البنك (الوديعة) - نسخة محسنة بدون خطوط
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

// تطبيق الفائدة على الوديعة
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

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `💰 عـمـلـيـة سـحـب 💰\n`;
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
    command: 'سحب',
    category: 'مملكة',
    description: '💰 سحب نقاط من البنك (الوديعة)',
    usage: '.سحب [المبلغ]',
    example: '.سحب 100',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            const fullText = getMessageText(msg);
            const args = fullText.trim().split(/\s+/).slice(1);
            const amount = parseInt(args[0]);

            // عرض المساعدة
            if (!amount || isNaN(amount) || amount <= 0) {
                const lines = [
                    '📖 *نظام السحب من البنك*',
                    '',
                    '❌ الرجاء إدخال مبلغ صحيح للسحب.',
                    '📝 مثال: .سحب 100',
                    '',
                    '📌 *ملاحظات:*',
                    '• يمكنك سحب أي مبلغ من وديعتك في البنك.',
                    '• يتم احتساب الفوائد تلقائياً قبل السحب.',
                    '• استخدم .بنك لعرض رصيدك في البنك.'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // تطبيق الفائدة قبل السحب
            const interestEarned = applyInterest(sender);
            const bankData = getBankData(sender);
            const deposit = bankData.deposit;

            // التحقق من وجود وديعة
            if (deposit === 0) {
                const lines = [
                    '❌ ليس لديك أي وديعة في البنك.',
                    '📌 استخدم .ايداع [المبلغ] لإيداع نقاط أولاً.',
                    '📌 استخدم .بنك لعرض حالتك المالية.'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // التحقق من كفاية الوديعة
            if (deposit < amount) {
                const lines = [
                    '❌ الوديعة لا تكفي.',
                    `🏦 رصيدك في البنك: ${deposit} نقطة`,
                    `📌 المطلوب: ${amount} نقطة`,
                    '',
                    '📌 يمكنك إيداع المزيد باستخدام .ايداع [المبلغ]'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            // خصم الوديعة وإضافة النقاط
            bankData.deposit -= amount;
            bankData.lastInterest = Date.now();
            saveBankData(sender, bankData);

            const points = loadJSON(pointsPath);
            points[sender] = (points[sender] || 0) + amount;
            saveJSON(pointsPath, points);

            // رسالة النجاح
            const lines = [
                `✅ تم سحب ${amount} نقطة من البنك.`,
                `💰 رصيدك النقدي: ${points[sender]} نقطة`,
                `🏦 الوديعة المتبقية: ${bankData.deposit} نقطة`
            ];

            if (interestEarned > 0) {
                lines.push(`✨ تم احتساب فوائد: +${interestEarned} نقطة قبل السحب.`);
            }

            lines.push('');
            lines.push('📌 استخدم .ايداع [المبلغ] للإيداع مرة أخرى');
            lines.push('📌 استخدم .بنك لعرض حالتك المالية');

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر سحب:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};