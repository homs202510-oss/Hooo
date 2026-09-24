// بروفايل.js - عرض معلومات المستخدم الكاملة (سريع مع الصور الشخصية) - نسخة متوافقة مع نظام التخزين المنفصل
const axios = require('axios');
const { jidDecode } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { isFounder, isOwnerbot, isDeveloper, toLid } = require('./lib-roles');
const { isElite } = require('./lib-roles');

// ========== المسارات ==========
const pointsPath = path.join(__dirname, 'db-points.json');
const warningsPath = path.join(__dirname, 'db-warnings.json');
const profilesPath = path.join(__dirname, 'db-profiles.json');
const hiddenPath = path.join(__dirname, 'db-hidden-points.json');
const ranksPath = path.join(__dirname, 'db-ranks.json');

// ===== مسارات التخزين المنفصل =====
const dataDir = __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const MAIN_PATH = path.join(dataDir, 'kd-main.json');
const STATS_PATH = path.join(dataDir, 'kd-stats.json');

// ===== التأكد من وجود جميع الملفات =====
if (!fs.existsSync(MAIN_PATH)) fs.writeFileSync(MAIN_PATH, JSON.stringify({}, null, 2));
if (!fs.existsSync(STATS_PATH)) fs.writeFileSync(STATS_PATH, JSON.stringify({}, null, 2));
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(warningsPath)) fs.writeFileSync(warningsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(profilesPath)) fs.writeFileSync(profilesPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(hiddenPath)) fs.writeFileSync(hiddenPath, JSON.stringify([], null, 2));
if (!fs.existsSync(ranksPath)) fs.writeFileSync(ranksPath, JSON.stringify({}, null, 2));

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } 
    catch { return {}; }
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

// ========== دوال التخزين المنفصل ==========
function loadUserData(jid) {
    const main = loadJSON(MAIN_PATH)[jid] || {};
    const stats = loadJSON(STATS_PATH)[jid] || {};

    return {
        level: main.level || 1,
        prosperity: main.prosperity || 0,
        lands: main.lands || 0,
        gold: main.gold || 0,
        name: main.name || `مملكة @${jid.split('@')[0]}`,
        owner: main.owner || jid,
        nameChangesUsed: main.nameChangesUsed || 0,
        pvpWins: stats.pvpWins || 0,
        pvpLosses: stats.pvpLosses || 0,
        monstersDefeated: stats.monstersDefeated || 0,
        lastActive: Date.now()
    };
}

function userExists(jid) {
    const main = loadJSON(MAIN_PATH);
    return !!main[jid];
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

// ========== المستوى ==========
function getLevel(points) {
    if (points >= 1000000000) return '👑 DEVELOPER';
    if (points >= 100000000) return '🌀 KING OF POINTS';
    if (points >= 10000000) return '💀 BIG BOSS';
    if (points >= 1000000) return '🔥 WTF';
    if (points >= 100000) return '🔪 KILLER';
    if (points >= 10000) return '🦁 LEGEND';
    if (points >= 1000) return '💎 PRO';
    if (points >= 500) return '⚡ ADVANCED';
    if (points >= 200) return '🌱 JUNIOR';
    return '🐣 NEWBIE';
}

// ========== الرتبة ==========
function getRank(jid) {
    try {
        const lid = toLid(jid);
        if (isFounder(lid)) return 4;
        if (isOwnerbot(lid)) return 3;
        if (isDeveloper(lid)) return 2;
        if (isElite(jid.split('@')[0])) return 1;
    } catch {}
    return 0;
}

function getRankName(rank) {
    if (rank === 4) return 'المالك 👑';
    if (rank === 3) return 'مالك البوت 💎';
    if (rank === 2) return 'مطور 💠';
    if (rank === 1) return 'نخبة 🌟';
    return 'مبتدئ 🌱';
}

function getNextLevel(points) {
    if (points < 200) return { name: '🌱 JUNIOR', remaining: 200 - points };
    if (points < 500) return { name: '⚡ ADVANCED', remaining: 500 - points };
    if (points < 1000) return { name: '💎 PRO', remaining: 1000 - points };
    if (points < 10000) return { name: '🦁 LEGEND', remaining: 10000 - points };
    if (points < 100000) return { name: '🔪 KILLER', remaining: 100000 - points };
    if (points < 1000000) return { name: '🔥 WTF', remaining: 1000000 - points };
    if (points < 10000000) return { name: '💀 BIG BOSS', remaining: 10000000 - points };
    if (points < 100000000) return { name: '🌀 KING OF POINTS', remaining: 100000000 - points };
    if (points < 1000000000) return { name: '👑 DEVELOPER', remaining: 1000000000 - points };
    return { name: '🏆 ماكس ليفل', remaining: 0 };
}

function getProgressBar(points) {
    const maxPoints = 10000;
    let percent = Math.min(100, (points / maxPoints) * 100);
    const filled = Math.floor(percent / 5);
    const empty = 20 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

// ========== التحقق من الصلاحية لعرض النقاط ==========
function canViewPoints(viewerJid, targetJid) {
    const hiddenList = loadJSON(hiddenPath);
    if (hiddenList.includes(targetJid)) {
        try {
            const viewerLid = toLid(viewerJid);
            if (isFounder(viewerLid) || isOwnerbot(viewerLid) || isDeveloper(viewerLid)) {
                return true;
            }
            if (isElite(viewerJid.split('@')[0])) {
                return true;
            }
        } catch {}
        return false;
    }
    return true;
}

// ========== دالة الإرسال السريع ==========
async function sendProfile(sock, chatId, lines, quoted = null, mentions = [], imageBuffer = null) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let caption = `📸 *بروفايل المستخدم* 📸\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            caption += `${line}\n`;
        }
    }
    caption += `    𝄞───✧𝑃𝐻𝐴𝑁𝑇𝑂𝑀✧───𝄞\n\n`;
    caption += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

    if (imageBuffer) {
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: caption,
            mentions: mentions
        }, { quoted: quoted });
    } else {
        await sock.sendMessage(chatId, { text: caption, mentions }, { quoted: quoted });
    }
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['بروفايل', 'مستواي', 'لفلي', 'لفل'],
    description: '📸 عرض معلومات المستخدم (النقاط، المستوى، الإنذارات، اللقب، وغيرها)',
    category: 'عام',
    usage: '.بروفايل [منشن أو رد]',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const isGroup = chatId.endsWith('@g.us');

            // ===== تحديد الهدف =====
            const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
            const sender = msg.key.participant || msg.key.remoteJid;
            let targetJid = null;

            if (contextInfo?.mentionedJid?.length > 0) {
                targetJid = contextInfo.mentionedJid[0];
            } else if (contextInfo?.quotedMessage) {
                targetJid = contextInfo.participant || msg.key.participant;
            }

            if (!targetJid) {
                targetJid = sender;
            }

            const targetNumber = targetJid.split('@')[0];

            // ===== تحميل البيانات =====
            const points = loadJSON(pointsPath);
            const warnings = loadJSON(warningsPath);
            const profiles = loadJSON(profilesPath);
            const hiddenList = loadJSON(hiddenPath);
            const ranks = loadJSON(ranksPath);

            const userPoints = points[targetJid] || 0;
            const userLevel = getLevel(userPoints);
            const userRank = getRank(targetJid);
            const rankName = getRankName(userRank);

            const showPoints = canViewPoints(sender, targetJid);
            const pointsDisplay = showPoints ? formatPoints(userPoints) : '🔒 مخفي';
            const isHidden = hiddenList.includes(targetJid);
            const hiddenStatus = isHidden ? '🔒 مخفي' : '🔓 ظاهر';

            // ===== الإنذارات =====
            let warningsCount = 0;
            let warningsReasons = [];
            if (warnings[chatId] && warnings[chatId][targetJid]) {
                const data = warnings[chatId][targetJid];
                warningsCount = data.count || 0;
                warningsReasons = data.reasons || [];
            }

            // ===== بيانات المملكة من النظام المنفصل =====
            let kingdomName = 'غير مسجل';
            let level = 1;
            let prosperity = 0;
            let lands = 0;
            let monstersDefeated = 0;
            let pvpWins = 0;
            let pvpLosses = 0;

            if (userExists(targetJid)) {
                const k = loadUserData(targetJid);
                kingdomName = k.name || 'مملكة غير مسماة';
                level = k.level || 1;
                prosperity = k.prosperity || 0;
                lands = k.lands || 0;
                monstersDefeated = k.monstersDefeated || 0;
                pvpWins = k.pvpWins || 0;
                pvpLosses = k.pvpLosses || 0;
            }

            // ===== اللقب =====
            let nickname = 'غير مسجل';
            let age = 'غير معروف';
            let gender = 'غير معروف';
            if (profiles[targetJid]) {
                nickname = profiles[targetJid].nickname || 'غير مسجل';
                age = profiles[targetJid].age || 'غير معروف';
                gender = profiles[targetJid].gender || 'غير معروف';
            }

            // ===== المستوى التالي =====
            const nextLevel = getNextLevel(userPoints);
            const progressBar = getProgressBar(userPoints);
            const percent = Math.min(100, (userPoints / 10000) * 100);

            // ===== عدد التخمينات الصحيحة =====
            const correctGuesses = ranks[targetJid] || 0;

            // ===== جلب صورة البروفايل =====
            let profilePicUrl = null;
            let imageBuffer = null;
            try {
                profilePicUrl = await sock.profilePictureUrl(targetJid, 'image');
                const response = await axios.get(profilePicUrl, { 
                    responseType: 'arraybuffer',
                    timeout: 5000 
                });
                imageBuffer = Buffer.from(response.data, 'binary');
            } catch (e) {
                // في حال فشل تحميل الصورة، نكمل بدونها
            }

            // ===== بناء الرسالة =====
            const lines = [
                `👤 *الاسم:* @${targetNumber}`,
                `🏷️ *اللقب:* ${nickname}`,
                `📅 *العمر:* ${age}`,
                `⚥ *الجنس:* ${gender}`,
                `🎖️ *الرتبة:* ${rankName}`,
                `💰 *النقاط:* ${pointsDisplay}`,
                `🎯 *المستوى القادم:* ${nextLevel.name}`,
                `📈 *المتبقي:* ${nextLevel.remaining > 0 ? formatPoints(nextLevel.remaining) + ' XP' : '✨ مكتمل'}`,
                `📊 *التقدم:* [${progressBar}] ${Math.round(percent)}%`,
                `🏰 *المملكة:* ${kingdomName}`,
                `📈 *مستوى المملكة:* ${level}`,
                `🌍 *الأراضي:* ${lands}`,
                `📈 *الازدهار:* ${prosperity}`,
                `💀 *وحوش قتلت:* ${monstersDefeated}`,
                `⚔️ *فوز PvP:* ${pvpWins}`,
                `💔 *خسارة PvP:* ${pvpLosses}`,
                `🎯 *تخمينات صحيحة:* ${correctGuesses}`,
                `⚠️ *الإنذارات:* ${warningsCount}/3`,
                warningsReasons.length > 0 ? `📝 *الأسباب:* ${warningsReasons.join('، ')}` : '',
                `🔒 *الخصوصية:* ${hiddenStatus}`
            ].filter(line => line && line.trim());

            // ===== إرسال البروفايل =====
            await sendProfile(sock, chatId, lines, msg, [targetJid], imageBuffer);

        } catch (error) {
            console.error('❌ خطأ في أمر بروفايل:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حدث خطأ\n📝 ${error.message || 'خطأ غير معروف'}`
            }, { quoted: msg });
        }
    }
};