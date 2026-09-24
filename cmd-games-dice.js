// حظي.js - لعبة رمي النرد مع شريط تحميل (نسخة محسنة بدون خطوط)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

if (!fs.existsSync(__dirname)) fs.mkdirSync(__dirname, { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));

function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

function getLevel(p) {
    if (p >= 1000000000) return '👑 DEVELOPER';
    if (p >= 100000000) return '🌀 KING OF POINTS';
    if (p >= 10000000) return '💀 BIG BOSS';
    if (p >= 1000000) return '🔥 WTF';
    if (p >= 100000) return '🔪 KILLER';
    if (p >= 10000) return '🦁 LEGEND';
    if (p >= 1000) return '💎 PRO';
    if (p >= 500) return '🔥 ADVANCED';
    if (p >= 200) return '🌱 JUNIOR';
    return '🐣 BEGINNER';
}

// ========== الجوائز ==========
const rewards = { 6: 100, 5: 60, 4: 30, 3: 10, 2: -20, 1: -50 };
const diceFaces = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' };

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎲 لـعـبـة الـحـظ 🎲\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== توليد شريط التحميل ==========
function getLoadingFrames() {
    const frames = [];
    for (let i = 0; i <= 10; i++) {
        frames.push(i);
    }
    return frames;
}

function getProgressBar(level, max = 10) {
    const filled = '█'.repeat(level);
    const empty = '░'.repeat(max - level);
    return filled + empty;
}

module.exports = {
    command: ['حظي'],
    category: 'العاب',
    description: '🎲 رمي النرد مع شريط تحميل',
    usage: '.حظي',

    async execute(sock, msg) {
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const chatId = msg.key.remoteJid;
            const points = loadJSON(pointsPath);

            if (!points[sender]) points[sender] = 0;

            // ===== النتيجة النهائية =====
            const dice = Math.floor(Math.random() * 6) + 1;
            const change = rewards[dice];
            const newPoints = points[sender] + change;
            points[sender] = newPoints;
            saveJSON(pointsPath, points);

            // ===== رسالة البداية =====
            const startMsg = await sock.sendMessage(chatId, {
                text: `🎲 *جَار رَمْيُ النَّرْد* 🎲
━━━━━━━━━━━━━━━━━━━━
🔄 جارٍ التحميل...
░░░░░░░░░░
━━━━━━━━━━━━━━━━━━━━
𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`
            }, { quoted: msg });

            // ===== شريط التحميل =====
            const frames = getLoadingFrames();
            for (let i = 0; i < frames.length; i++) {
                const level = frames[i];
                const bar = getProgressBar(level);
                await sock.sendMessage(chatId, {
                    text: `🎲 *جَار رَمْيُ النَّرْد* 🎲
━━━━━━━━━━━━━━━━━━━━
🔄 جارٍ التحميل...
${bar}
━━━━━━━━━━━━━━━━━━━━
𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`,
                    edit: startMsg.key
                }).catch(() => {});
                await new Promise(r => setTimeout(r, 120));
            }

            // ===== النتيجة النهائية =====
            const diceSymbol = diceFaces[dice];
            const icon = change > 0 ? '🎉' : (change < 0 ? '😢' : '🍃');
            const sign = change > 0 ? `+${change}` : `${change}`;
            const resultText = change > 0 ? `ربحت ${change} نقطة!` : (change < 0 ? `خسرت ${-change} نقطة!` : `لا ربح ولا خسارة`);

            const lines = [
                `🎲 *نـتـيـجـة الـرَّمْـي* 🎲`,
                '',
                `👤 @${sender.split('@')[0]}`,
                `🎯 النتيجة: ${dice} ${diceSymbol}`,
                `📊 ${resultText}`,
                `💰 رصيدك: ${newPoints} نقطة`,
                `🏅 رتبتك: ${getLevel(newPoints)}`
            ];

            let msgText = `🎲 نـتـيـجـة الـحـظ 🎲\n`;
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            for (const line of lines) {
                msgText += `${line}\n`;
            }
            msgText += `━━━━━━━━━━━━━━━━━━━━\n`;
            msgText += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

            await sock.sendMessage(chatId, {
                text: msgText,
                mentions: [sender],
                edit: startMsg.key
            }).catch(() => {});

        } catch (error) {
            console.error('✗ خطأ في أمر حظي:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};