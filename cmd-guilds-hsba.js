// حسبة.js - نظام إحصائيات الرسائل اليومية

const fs = require('fs');
const path = require('path');

// ========== المسارات ==========
const statsFile = path.join(__dirname, 'db-dailyStats.json');
const historyFile = path.join(__dirname, 'db-statsHistory.json');

// ========== التأكد من وجود الملفات ==========
if (!fs.existsSync(statsFile)) {
    fs.writeFileSync(statsFile, JSON.stringify({
        date: new Date().toDateString(),
        data: {}
    }, null, 2));
}

if (!fs.existsSync(historyFile)) {
    fs.writeFileSync(historyFile, JSON.stringify([]));
}

// ========== دوال التحميل والحفظ ==========
function loadStats() {
    try { return JSON.parse(fs.readFileSync(statsFile)); } catch { 
        return { date: new Date().toDateString(), data: {} };
    }
}

function saveStats(data) {
    fs.writeFileSync(statsFile, JSON.stringify(data, null, 2));
}

function loadHistory() {
    try { return JSON.parse(fs.readFileSync(historyFile)); } catch { return []; }
}

function saveHistory(data) {
    fs.writeFileSync(historyFile, JSON.stringify(data, null, 2));
}

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `📊 *نـظـام الإحـصـائـيـات* 📊\n`;
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

// ========== دالة جلب اسم المستخدم ==========
async function getUserName(sock, jid) {
    try {
        const contact = await sock.contact(jid);
        return contact?.name || contact?.notify || jid.split('@')[0];
    } catch {
        return jid.split('@')[0];
    }
}

// ========== دالة التحقق من تاريخ اليوم ==========
function isNewDay() {
    const now = new Date();
    const today = now.toDateString();
    const stats = loadStats();
    return stats.date !== today;
}

// ========== دالة إعادة تعيين الإحصائيات ==========
function resetStats() {
    const now = new Date();
    const stats = loadStats();
    const history = loadHistory();
    
    // حفظ الإحصائيات القديمة في التاريخ
    if (Object.keys(stats.data).length > 0) {
        history.push({
            date: stats.date,
            data: stats.data
        });
        // الاحتفاظ بآخر 30 يوم فقط
        if (history.length > 30) {
            history.shift();
        }
        saveHistory(history);
    }
    
    // إعادة تعيين الإحصائيات
    const newStats = {
        date: now.toDateString(),
        data: {}
    };
    saveStats(newStats);
    
    return newStats;
}

// ========== دالة تحديث الإحصائيات ==========
function updateStats(sender) {
    // التحقق من بداية يوم جديد
    if (isNewDay()) {
        resetStats();
    }
    
    const stats = loadStats();
    if (!stats.data[sender]) {
        stats.data[sender] = 0;
    }
    stats.data[sender]++;
    saveStats(stats);
    return stats;
}

// ========== دالة عرض الترتيب ==========
async function showRanking(sock, chatId, msg) {
    const stats = loadStats();
    const now = new Date();
    const today = now.toDateString();
    
    if (stats.date !== today) {
        // محاولة عرض إحصائيات الأمس
        const history = loadHistory();
        if (history.length > 0) {
            const yesterday = history[history.length - 1];
            if (Object.keys(yesterday.data).length > 0) {
                const sorted = Object.entries(yesterday.data).sort((a, b) => b[1] - a[1]);
                const top10 = sorted.slice(0, 10);
                const totalMessages = sorted.reduce((sum, [, count]) => sum + count, 0);
                
                const lines = [
                    `📊 *إحصائيات الأمس*`,
                    '',
                    `📅 ${yesterday.date}`,
                    `📊 إجمالي الرسائل: ${totalMessages}`,
                    `👥 عدد المشاركين: ${sorted.length}`,
                    '',
                    `🏆 *أكثر 10 مشاركين*`,
                    ''
                ];
                
                const mentions = [];
                for (let i = 0; i < top10.length; i++) {
                    const [jid, count] = top10[i];
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                    const name = await getUserName(sock, jid);
                    lines.push(`${medal} @${name} ─ ${count} رسالة`);
                    mentions.push(jid);
                }
                
                await sendMessage(sock, chatId, lines, msg, mentions);
                return;
            }
        }
        
        await sendMessage(sock, chatId, [
            '📊 *لا توجد إحصائيات اليوم*',
            '',
            '📌 لم يتم تسجيل أي رسائل اليوم بعد.',
            '💡 ابدأ بإرسال الرسائل لتظهر إحصائياتك!'
        ], msg);
        return;
    }
    
    const data = stats.data;
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
    
    if (sorted.length === 0) {
        await sendMessage(sock, chatId, [
            '📊 *لا توجد إحصائيات اليوم*',
            '',
            '📌 لم يتم تسجيل أي رسائل اليوم بعد.',
            '💡 ابدأ بإرسال الرسائل لتظهر إحصائياتك!'
        ], msg);
        return;
    }
    
    const top10 = sorted.slice(0, 10);
    const totalMessages = sorted.reduce((sum, [, count]) => sum + count, 0);
    
    const lines = [
        `📊 *إحصائيات اليوم*`,
        '',
        `📅 ${now.toLocaleDateString('ar-EG')}`,
        `📊 إجمالي الرسائل: ${totalMessages}`,
        `👥 عدد المشاركين: ${sorted.length}`,
        '',
        `🏆 *أكثر 10 مشاركين*`,
        ''
    ];
    
    const mentions = [];
    for (let i = 0; i < top10.length; i++) {
        const [jid, count] = top10[i];
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        const name = await getUserName(sock, jid);
        lines.push(`${medal} @${name} ─ ${count} رسالة`);
        mentions.push(jid);
    }
    
    await sendMessage(sock, chatId, lines, msg, mentions);
}

// ========== دالة التحديث التلقائي عند منتصف الليل ==========
function startMidnightReset() {
    setInterval(() => {
        const now = new Date();
        const stats = loadStats();
        const today = now.toDateString();
        
        if (stats.date !== today) {
            const oldStats = { ...stats };
            resetStats();
            console.log(`📊 تم إعادة تعيين الإحصائيات في ${now.toLocaleString('ar-EG')}`);
        }
    }, 60000); // التحقق كل دقيقة
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['حسبة'],
    category: 'نقابات',
    description: '📊 عرض إحصائيات الرسائل اليومية',
    usage: '.حسبة',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            
            if (!chatId.endsWith('@g.us')) {
                await sendMessage(sock, chatId, [
                    '❌ *هذا الأمر يعمل داخل المجموعات فقط.*'
                ], msg);
                return;
            }
            
            await showRanking(sock, chatId, msg);
            
        } catch (error) {
            console.error('❌ خطأ في أمر حسبة:', error);
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

// ========== دالة تحديث الإحصائيات من الرسائل ==========
async function updateDailyStats(sock, msg) {
    try {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        
        // فقط للمجموعات
        if (!chatId.endsWith('@g.us')) return;
        
        // تحديث الإحصائيات
        const stats = updateStats(sender);
        
    } catch (error) {
        console.error('❌ خطأ في تحديث الإحصائيات:', error);
    }
}

// ========== بدء تشغيل نظام منتصف الليل ==========
startMidnightReset();

// ========== تصدير الدوال ==========
module.exports.updateDailyStats = updateDailyStats;
module.exports.showRanking = showRanking;