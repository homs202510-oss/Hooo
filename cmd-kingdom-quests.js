// مهمة.js - عرض المهام اليومية وتقدمك (نسخة متوافقة مع نظام التخزين المنفصل)
const fs = require('fs');
const path = require('path');

const questPath = path.join(__dirname, 'db-quests.json');
const pointsPath = path.join(__dirname, 'db-points.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const ACTIVE_PATH = path.join(dataDir, 'kd-active.json');
const STATS_PATH = path.join(dataDir, 'kd-stats.json');

// ===== التأكد من وجود جميع الملفات =====
const allPaths = [MAIN_PATH, ACTIVE_PATH, STATS_PATH];
for (const p of allPaths) {
    if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(questPath)) fs.writeFileSync(questPath, JSON.stringify({}, null, 2));

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
    const stats = loadJSON(STATS_PATH)[jid] || {};

    return {
        level: main.level || 1,
        prosperity: main.prosperity || 0,
        lands: main.lands || 0,
        gold: main.gold || 0,
        name: main.name || `مملكة @${jid.split('@')[0]}`,
        owner: main.owner || jid,
        nameChangesUsed: main.nameChangesUsed || 0,
        monstersDefeated: stats.monstersDefeated || 0,
        pvpWins: stats.pvpWins || 0,
        pvpLosses: stats.pvpLosses || 0,
        lastActive: active.lastActive || Date.now(),
        lastDaily: active.lastDaily || 0
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

    const stats = loadJSON(STATS_PATH);
    stats[jid] = {
        monstersDefeated: data.monstersDefeated || 0,
        pvpWins: data.pvpWins || 0,
        pvpLosses: data.pvpLosses || 0
    };
    saveJSON(STATS_PATH, stats);

    const active = loadJSON(ACTIVE_PATH);
    active[jid] = {
        lastActive: data.lastActive || Date.now(),
        lastDaily: data.lastDaily || 0
    };
    saveJSON(ACTIVE_PATH, active);
}

function userExists(jid) {
    const main = loadJSON(MAIN_PATH);
    return !!main[jid];
}

// ========== قائمة المهام ==========
const questsList = [
    { id: 1, name: '⚔️ قهر وحش', type: 'monster', target: 1, rewardPoints: 100, rewardWood: 50, rewardStone: 30, rewardIron: 10, desc: 'اقتل وحشاً واحداً' },
    { id: 2, name: '💰 جامع الضرائب', type: 'daily', target: 1, rewardPoints: 80, rewardWood: 30, rewardStone: 20, rewardIron: 5, desc: 'اجمع الضرائب اليومية' },
    { id: 3, name: '⚔️ الغزاة', type: 'pvpWin', target: 1, rewardPoints: 150, rewardWood: 80, rewardStone: 50, rewardIron: 15, desc: 'اربح معركة PvP واحدة' }
];

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `📋 المـهـام الـيـومـيـة 📋\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: 'مهمة',
    description: '📋 عرض المهام اليومية وتقدمك',
    category: 'مملكة',
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

            // تحميل البيانات
            const points = loadJSON(pointsPath);
            let questData = loadJSON(questPath);

            // ===== التحقق من وجود مملكة =====
            if (!userExists(sender)) {
                await sendMessage(sock, chatId, [
                    `❌ @${sender.split('@')[0]}، ليس لديك مملكة.`,
                    `📌 استخدم .لاعب جديد لتأسيس مملكتك.`
                ], msg, [sender]);
                return;
            }

            // ===== تحديث بيانات المستخدم =====
            let user = loadUserData(sender);
            saveUserData(sender, user);

            // تهيئة بيانات المهام
            if (!questData[sender]) {
                questData[sender] = { 
                    lastReset: Date.now(), 
                    progress: { monster: 0, daily: 0, pvpWin: 0 }, 
                    completed: [] 
                };
                saveJSON(questPath, questData);
            }

            const userQuests = questData[sender];
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            // إعادة تعيين المهام يومياً
            if (now - userQuests.lastReset > oneDay) {
                userQuests.progress = { monster: 0, daily: 0, pvpWin: 0 };
                userQuests.completed = [];
                userQuests.lastReset = now;
                saveJSON(questPath, questData);
            }

            // ===== عرض المهام =====
            const completedCount = userQuests.completed.length;
            const totalQuests = questsList.length;
            const progress = Math.round((completedCount / totalQuests) * 100);

            const lines = [
                `👤 @${sender.split('@')[0]}`,
                `📊 التقدم: ${completedCount}/${totalQuests} (${progress}%)`,
                ``,
                `📋 *قائمة المهام:*`,
                ``
            ];

            for (const q of questsList) {
                const current = userQuests.progress[q.type] || 0;
                const done = userQuests.completed.includes(q.id);
                const status = done ? '✅' : '⏳';
                
                const progressBar = '▰'.repeat(Math.min(current, q.target)) + '▱'.repeat(Math.max(0, q.target - current));
                
                lines.push(`${status} *${q.name}*`);
                lines.push(`   📊 ${progressBar} ${current}/${q.target}`);
                lines.push(`   📝 ${q.desc}`);
                lines.push(`   🎁 ${q.rewardPoints} نقطة | ${q.rewardWood} خشب | ${q.rewardStone} حجر | ${q.rewardIron} حديد`);
                lines.push(``);
            }

            lines.push(`💡 *لإنهاء مهمة:* .اتمام [رقم المهمة]`);
            lines.push(`📝 مثال: .اتمام 1`);

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر مهمة:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};