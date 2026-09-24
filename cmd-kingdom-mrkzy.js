// مركزي.js - لوحة التحكم المالية المركزية (للمطورين فقط) - مع عرض المنشنات الصحيحة
const fs = require('fs');
const path = require('path');
const hay = require('./lib-roles');

const bankPath = path.join(__dirname, 'db-bank.json');
const pointsPath = path.join(__dirname, 'db-points.json');
const loansPath = path.join(__dirname, 'db-loans.json');
const kingdomPath = path.join(__dirname, 'db-kingdom.json');

// التأكد من وجود الملفات
if (!fs.existsSync(path.dirname(bankPath))) fs.mkdirSync(path.dirname(bankPath), { recursive: true });
if (!fs.existsSync(bankPath)) fs.writeFileSync(bankPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(loansPath)) fs.writeFileSync(loansPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(kingdomPath)) fs.writeFileSync(kingdomPath, JSON.stringify({}, null, 2));

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; }
}
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

// ========== دالة الحصول على اسم المستخدم من ملف الممالك ==========
function getUserName(jid, kingdomData) {
    if (!kingdomData) return null;
    const user = kingdomData[jid];
    if (user && user.name) {
        return user.name;
    }
    return null;
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `🏦 الـبـنـك الـمـركـزي 🏦\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: 'مركزي',
    category: 'مملكة',
    description: '🏦 لوحة التحكم المالية المركزية (للمطورين فقط)',
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            // التحقق من الصلاحيات
            const senderLid = hay.toLid(sender);
            if (!(hay.isFounder(senderLid) || hay.isOwnerbot(senderLid) || hay.isDeveloper(senderLid))) {
                return await sendMessage(sock, chatId, ['🚫 هذا الأمر مخصص للمطورين فقط.'], msg, [sender]);
            }

            // تحميل البيانات
            const bank = loadJSON(bankPath);
            const points = loadJSON(pointsPath);
            const loans = loadJSON(loansPath);
            const kingdomData = loadJSON(kingdomPath);

            // ===== إحصائيات البنك =====
            const bankEntries = Object.entries(bank);
            let totalDeposits = 0;
            let depositorsCount = 0;
            const depositorsList = [];

            for (const [jid, data] of bankEntries) {
                const deposit = data.deposit || 0;
                if (deposit > 0) {
                    depositorsCount++;
                    totalDeposits += deposit;
                    const userName = getUserName(jid, kingdomData);
                    depositorsList.push({
                        jid: jid,
                        deposit: deposit,
                        userName: userName,
                        lastUpdate: data.lastInterest || Date.now()
                    });
                }
            }
            depositorsList.sort((a, b) => b.deposit - a.deposit);

            // ===== إحصائيات النقاط =====
            const pointsEntries = Object.entries(points);
            let totalPoints = 0;
            let pointsCount = 0;
            for (const [jid, amount] of pointsEntries) {
                if (amount > 0) {
                    totalPoints += amount;
                    pointsCount++;
                }
            }

            // ===== إحصائيات القروض =====
            const loanEntries = Object.entries(loans);
            let totalLoans = 0;
            let activeLoans = 0;
            let totalDebt = 0;
            const debtorsList = [];
            for (const [jid, loan] of loanEntries) {
                if (loan.remaining > 0) {
                    activeLoans++;
                    totalDebt += loan.remaining;
                    totalLoans += loan.amount || 0;
                    const userName = getUserName(jid, kingdomData);
                    debtorsList.push({
                        jid: jid,
                        remaining: loan.remaining,
                        amount: loan.amount || 0,
                        userName: userName
                    });
                }
            }
            debtorsList.sort((a, b) => b.remaining - a.remaining);

            // ===== بناء الرسالة =====
            const lines = [
                '📊 *الملخص المالي العام*',
                '',
                `💰 *إجمالي النقاط:* ${formatPoints(totalPoints)} نقطة`,
                `👥 *عدد الحسابات النشطة:* ${pointsCount}`,
                '',
                `🏦 *الودائع البنكية:*`,
                `   💰 إجمالي الودائع: ${formatPoints(totalDeposits)} نقطة`,
                `   👥 عدد المودعين: ${depositorsCount}`,
                '',
                `📊 *القروض:*`,
                `   📈 عدد القروض النشطة: ${activeLoans}`,
                `   💰 إجمالي الديون: ${formatPoints(totalDebt)} نقطة`,
                `   📊 إجمالي المبالغ المقترضة: ${formatPoints(totalLoans)} نقطة`,
                '',
            ];

            // ===== عرض أهم المودعين (أعلى 5) =====
            if (depositorsList.length > 0) {
                lines.push('🏆 *أكبر 5 مودعين:*');
                const top5 = depositorsList.slice(0, 5);
                for (let i = 0; i < top5.length; i++) {
                    const d = top5[i];
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
                    const displayName = d.userName ? `"${d.userName}"` : `@${d.jid.split('@')[0]}`;
                    lines.push(`   ${medal} ${displayName} → ${formatPoints(d.deposit)} نقطة`);
                }
                lines.push('');
            }

            // ===== عرض أكثر المديونين (أعلى 5) =====
            if (debtorsList.length > 0) {
                lines.push('⚠️ *أكثر المديونين (أعلى 5):*');
                const top5Debtors = debtorsList.slice(0, 5);
                for (let i = 0; i < top5Debtors.length; i++) {
                    const d = top5Debtors[i];
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
                    const displayName = d.userName ? `"${d.userName}"` : `@${d.jid.split('@')[0]}`;
                    lines.push(`   ${medal} ${displayName} → ${formatPoints(d.remaining)} نقطة (إجمالي القرض: ${formatPoints(d.amount)})`);
                }
                lines.push('');
            }

            lines.push('📌 *للاطلاع على تفاصيل الودائع:* .مركزي ودائع');
            lines.push('📌 *للاطلاع على تفاصيل القروض:* .مركزي قروض');

            // جمع المنشنات لجميع المستخدمين المذكورين
            const mentions = [];
            for (const d of depositorsList) {
                if (!d.userName) mentions.push(d.jid);
            }
            for (const d of debtorsList) {
                if (!d.userName) mentions.push(d.jid);
            }

            await sendMessage(sock, chatId, lines, msg, mentions);

        } catch (error) {
            console.error('❌ خطأ في أمر مركزي:', error);
            await sendMessage(sock, msg.key.remoteJid, ['❌ حدث خطأ أثناء عرض البنك المركزي.'], msg);
        }
    }
};