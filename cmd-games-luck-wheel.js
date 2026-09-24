// حظ.js - عجلة الحظ (نسخة محسنة بدون خطوط)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

if (!fs.existsSync(__dirname)) fs.mkdirSync(__dirname, { recursive: true });
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
    return '🐣 BEGINNER';
}

// ========== جوائز العجلة ==========
const rewards = [
    { icon: '🎁', name: 'هدية', points: 50 },
    { icon: '⭐', name: 'نجمة', points: 100 },
    { icon: '🔥', name: 'نار', points: 150 },
    { icon: '💎', name: 'ألماس', points: 200 },
    { icon: '🍀', name: 'برسيم', points: 80 },
    { icon: '🎉', name: 'احتفال', points: 120 },
    { icon: '👑', name: 'تاج', points: 300 },
    { icon: '❌', name: 'خسارة', points: -50 },
    { icon: '💔', name: 'قلب', points: -80 },
    { icon: '⚡', name: 'صاعقة', points: -120 },
    { icon: '🌪️', name: 'إعصار', points: -150 },
    { icon: '😭', name: 'دموع', points: -40 }
];

// ========== بناء إطار العجلة ==========
function buildWheelFrame(offset) {
    const segments = rewards.map(r => r.icon);
    const rotated = [...segments.slice(offset), ...segments.slice(0, offset)];

    return `┌───────────┐
│ ${rotated[0]}  ${rotated[1]}  ${rotated[2]} │
│ ${rotated[11]}  🎡  ${rotated[3]} │
│ ${rotated[10]}  ${rotated[9]}  ${rotated[8]} │
└───────────┘
           🔺 السهم`;
}

// ========== خطوات الدوران ==========
function getRotationSteps() {
    const steps = [];
    const totalSteps = 8;
    for (let i = 0; i <= totalSteps; i++) {
        const stepOffset = Math.floor((i * 1.8) % 12);
        steps.push(stepOffset);
    }
    return steps;
}

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
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['حظ'],
    description: '🎡 عجلة الحظ – دور واستمتع',
    category: 'العاب',
    usage: '.حظ',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const points = loadJSON(pointsPath);

            if (!points[sender]) points[sender] = 0;

            // ===== اختيار الجائزة النهائية =====
            const finalReward = rewards[Math.floor(Math.random() * rewards.length)];
            const oldPoints = points[sender] || 0;
            const newPoints = oldPoints + finalReward.points;
            points[sender] = newPoints;
            saveJSON(pointsPath, points);

            // ===== رسالة البداية =====
            const startMsg = await sock.sendMessage(chatId, {
                text: `🎡 *عـجـلـة الـحـظ* 🎡
━━━━━━━━━━━━━━━━━━━━
🌀 جارٍ تدوير العجلة...
🔻 ستتوقف عند الجائزة المناسبة
━━━━━━━━━━━━━━━━━━━━
𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`
            }, { quoted: msg });

            // ===== مراحل الدوران =====
            const steps = getRotationSteps();
            const delayStart = 80;
            const delayEnd = 250;

            for (let i = 0; i < steps.length; i++) {
                const offset = steps[i];
                const frame = buildWheelFrame(offset);
                const delay = delayStart + (delayEnd - delayStart) * (i / steps.length);

                await sock.sendMessage(chatId, {
                    text: `🎡 *عـجـلـة الـحـظ* 🎡
━━━━━━━━━━━━━━━━━━━━
🌀 جارٍ التدوير...
${frame}
━━━━━━━━━━━━━━━━━━━━
𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`,
                    edit: startMsg.key
                }).catch(() => {});
                await new Promise(r => setTimeout(r, delay));
            }

            // ===== النتيجة النهائية =====
            const winIcon = finalReward.points >= 0 ? '🎉' : '😢';
            const sign = finalReward.points >= 0 ? `+${finalReward.points}` : `${finalReward.points}`;

            const lines = [
                '🎡 *نـتـيـجـة الـحـظ*',
                '',
                `👤 @${sender.split('@')[0]}`,
                `🎁 الجائزة: ${finalReward.icon} ${finalReward.name}`,
                `💰 التغيير: ${sign} نقطة`,
                `📊 رصيدك: ${newPoints} نقطة`,
                `🏅 رتبتك: ${getLevel(newPoints)}`
            ];

            let msgText = `🎡 نـتـيـجـة الـحـظ 🎡\n`;
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
            console.error('✗ خطأ في أمر حظ:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};