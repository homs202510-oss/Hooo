// اتمام.js - إنهاء مهمة يومية (نسخة متوافقة مع نظام التخزين المنفصل)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const questPath = path.join(__dirname, 'db-quests.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const RESOURCES_PATH = path.join(dataDir, 'kd-resources.json');
const ACTIVE_PATH = path.join(dataDir, 'kd-active.json');
const STATS_PATH = path.join(dataDir, 'kd-stats.json');

// ===== التأكد من وجود جميع الملفات =====
const allPaths = [MAIN_PATH, RESOURCES_PATH, ACTIVE_PATH, STATS_PATH];
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
    const resources = loadJSON(RESOURCES_PATH)[jid] || {};
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
        resources: resources,
        monstersDefeated: stats.monstersDefeated || 0,
        pvpWins: stats.pvpWins || 0,
        pvpLosses: stats.pvpLosses || 0,
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

    const resources = loadJSON(RESOURCES_PATH);
    resources[jid] = data.resources || { wood: 0, stone: 0, iron: 0 };
    saveJSON(RESOURCES_PATH, resources);

    const stats = loadJSON(STATS_PATH);
    stats[jid] = {
        monstersDefeated: data.monstersDefeated || 0,
        pvpWins: data.pvpWins || 0,
        pvpLosses: data.pvpLosses || 0
    };
    saveJSON(STATS_PATH, stats);

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

// ========== قائمة المهام ==========
const questsList = [
    { id: 1, name: 'قهر وحش', type: 'monster', target: 1, rewardPoints: 100, rewardWood: 50, rewardStone: 30, rewardIron: 10 },
    { id: 2, name: 'جامع الضرائب', type: 'daily', target: 1, rewardPoints: 80, rewardWood: 30, rewardStone: 20, rewardIron: 5 },
    { id: 3, name: 'الغزاة', type: 'pvpWin', target: 1, rewardPoints: 150, rewardWood: 80, rewardStone: 50, rewardIron: 15 }
];

module.exports = {
    command: 'اتمام',
    description: '✅ إنهاء مهمة يومية',
    category: 'مملكة',
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
        const args = msg.message?.conversation?.split(' ') || msg.message?.extendedTextMessage?.text?.split(' ') || [];
        
        if (args.length < 2) {
            await sock.sendMessage(chatId, { text: `⚠️ استخدم: .اتمام [رقم المهمة]`, quoted: msg });
            return;
        }
        
        const questId = parseInt(args[1]);
        const quest = questsList.find(q => q.id === questId);
        if (!quest) {
            await sock.sendMessage(chatId, { text: `❌ رقم مهمة غير صحيح.`, quoted: msg });
            return;
        }

        // ===== التحقق من وجود مملكة =====
        if (!userExists(sender)) {
            await sock.sendMessage(chatId, { text: `❌ ليس لديك مملكة. استخدم .لاعب جديد لتأسيس مملكتك.`, quoted: msg });
            return;
        }

        // ===== تحميل بيانات المهام =====
        let questData = loadJSON(questPath);
        if (!questData[sender]) {
            await sock.sendMessage(chatId, { text: `❌ لا توجد بيانات مهام. استخدم .مهمة أولاً.`, quoted: msg });
            return;
        }

        const userQuests = questData[sender];
        if (userQuests.completed.includes(questId)) {
            await sock.sendMessage(chatId, { text: `⚠️ لقد أنجزت هذه المهمة اليوم بالفعل.`, quoted: msg });
            return;
        }

        let current = userQuests.progress[quest.type] || 0;
        if (current < quest.target) {
            await sock.sendMessage(chatId, { text: `❌ لم تنجز ${quest.name} بعد. تقدمك: ${current}/${quest.target}`, quoted: msg });
            return;
        }

        // ===== تحميل البيانات =====
        const points = loadJSON(pointsPath);
        let user = loadUserData(sender);

        // ===== إضافة المكافآت =====
        points[sender] = (points[sender] || 0) + quest.rewardPoints;
        user.resources.wood = (user.resources.wood || 0) + quest.rewardWood;
        user.resources.stone = (user.resources.stone || 0) + quest.rewardStone;
        user.resources.iron = (user.resources.iron || 0) + quest.rewardIron;
        user.lastActive = Date.now();

        // ===== حفظ البيانات =====
        saveJSON(pointsPath, points);
        saveUserData(sender, user);

        // ===== تحديث المهام =====
        userQuests.completed.push(questId);
        saveJSON(questPath, questData);

        // ===== رسالة النجاح =====
        await sock.sendMessage(chatId, { 
            text: `✅ @${sender.split('@')[0]} أنجز مهمة "${quest.name}"!\n💰 +${quest.rewardPoints} نقطة\n🪵 +${quest.rewardWood} خشب\n🪨 +${quest.rewardStone} حجر\n⛏️ +${quest.rewardIron} حديد`,
            mentions: [sender]
        }, { quoted: msg });
    }
};