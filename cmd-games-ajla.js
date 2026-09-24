// عجلة.js - عجلة الحظ بالنقاط (نسخة محسنة بدون خطوط)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

if (!fs.existsSync(path.dirname(pointsPath))) fs.mkdirSync(path.dirname(pointsPath), { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));

function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

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
    if (points < -10) return '🪫 NOOB';
    return '🐣 NEWBIE';
}

// ========== قطاعات العجلة ==========
const rewards = [
    { text: '🎁 هدية +50 نقطة', points: 50 },
    { text: '⭐ فرصة +100 نقطة', points: 100 },
    { text: '🆓 مجاني +30 نقطة', points: 30 },
    { text: '🔥 حظ خارق +150 نقطة', points: 150 },
    { text: '🎉 مفاجأة +70 نقطة', points: 70 },
    { text: '❌ خسارة -50 نقطة', points: -50 },
    { text: '🚫 عقاب -100 نقطة', points: -100 }
];

// ========== أشكال العجلة ==========
const frames = [
    `
              🔻
┌─────────────┐
│ 🎁 │ 🚫 │ ⭐ │
│ 🔄 │ 🎡 │ 🆓 │
│ ❌ │ 😢 │ 🎉 │
└─────────────┘`,

    `
              🔻
┌─────────────┐
│ 🚫 │ ⭐ │ 🔄 │
│ 🎡 │ 🆓 │ ❌ │
│ 😢 │ 🎉 │ 🎁 │
└─────────────┘`,

    `
              🔻
┌─────────────┐
│ ⭐ │ 🔄 │ 🆓 │
│ ❌ │ 🎡 │ 😢 │
│ 🎉 │ 🎁 │ 🚫 │
└─────────────┘`,

    `
              🔻
┌─────────────┐
│ 🔄 │ 🆓 │ ❌ │
│ 😢 │ 🎡 │ 🎉 │
│ 🎁 │ 🚫 │ ⭐ │
└─────────────┘`
];

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🎡 عـجـلـة الـحـظ 🎡\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: 'عجلة',
    description: '🎡 عجلة الحظ بالنقاط',
    category: 'العاب',
    usage: '.عجلة',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
            const points = loadJSON(pointsPath);

            // اختيار عشوائي
            const result = rewards[Math.floor(Math.random() * rewards.length)];

            // حفظ النقاط
            points[sender] = (points[sender] || 0) + result.points;
            saveJSON(pointsPath, points);

            // إرسال البداية
            const sent = await sock.sendMessage(chatId, {
                text: `🎡 جاري تدوير عجلة الحظ الأسطورية...`
            }, { quoted: msg });

            let delay = 30;

            // دوران مع تباطؤ
            for (let i = 0; i < 6; i++) {
                await new Promise(r => setTimeout(r, delay));
                delay += 3;

                await sock.sendMessage(chatId, {
                    text: `🎡 عـجـلـة الـحـظ 🎡
━━━━━━━━━━━━━━━━━━━━
${frames[i % frames.length]}
━━━━━━━━━━━━━━━━━━━━
${i < 3 ? '🔄 جاري الدوران...' : '⏳ تتوقف...'}`,
                    edit: sent.key
                });
            }

            // عرض النتيجة
            const lines = [
                `🔻 توقفت العجلة على:`,
                '',
                ` ${result.text}`,
                '',
                `💰 نقاطك: ${points[sender]}`,
                `🏅 رتبتك: ${getLevel(points[sender])}`,
                '',
                `🎉 @${sender.split('@')[0]}`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

        } catch (error) {
            console.error('✗ خطأ في أمر عجلة:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};