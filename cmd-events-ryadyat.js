const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const ranksPath = path.join(__dirname, 'db-ranks.json');

if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, '{}');
if (!fs.existsSync(ranksPath)) fs.writeFileSync(ranksPath, '{}');

function loadJSON(file, fallback) {
    try {
        if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
        return JSON.parse(fs.readFileSync(file));
    } catch {
        return fallback;
    }
}

function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getLevel(points) {
    if (points >= 1000000000) return '👑 DEVELOPER';
    if (points >= 100000000) return '🌀 KING OF POINTS';
    if (points >= 10000000) return '💀 BIG BOSS';
    if (points >= 1000000) return '🔥🔥 WTF';
    if (points >= 100000) return '🔪🩸 KILLER';
    if (points >= 10000) return '🦁 LEGEND';
    if (points >= 1000) return '💎 PRO';
    if (points >= 500) return '🔥 ADVANCED';
    if (points >= 200) return '🌱 JUNIOR';
    if (points < -10) return '🪫 NOOB';
    return '🌱 JUNIOR';
}

// ================================
// ⚙️ إعدادات
// ================================
const rewardMap = { سهل: 50, متوسط: 100, صعب: 200 };
const penaltyMap = { سهل: 50, متوسط: 100, صعب: 200 };
const timeMap = { سهل: 15000, متوسط: 20000, صعب: 30000 };

// ================================
// 🎌 أسئلة رياضيات
// ================================
const mathQuestions = {
    سهل: [
        { q: '5 + 3 = ?', a: '8' },
        { q: '10 - 4 = ?', a: '6' },
        { q: '2 × 6 = ?', a: '12' },
        { q: '12 ÷ 3 = ?', a: '4' },
        { q: '7 + 2 = ?', a: '9' },
        { q: '9 + 4 = ?', a: '13' },
        { q: '15 - 7 = ?', a: '8' },
        { q: '3 × 7 = ?', a: '21' },
        { q: '24 ÷ 6 = ?', a: '4' },
        { q: '6 + 8 = ?', a: '14' },
        { q: '20 - 5 = ?', a: '15' },
        { q: '4 × 9 = ?', a: '36' },
        { q: '56 ÷ 7 = ?', a: '8' },
        { q: '11 + 9 = ?', a: '20' },
        { q: '18 - 9 = ?', a: '9' },
        { q: '5 × 8 = ?', a: '40' },
        { q: '72 ÷ 8 = ?', a: '9' },
        { q: '13 + 7 = ?', a: '20' },
        { q: '25 - 10 = ?', a: '15' },
        { q: '6 × 6 = ?', a: '36' },
        { q: '81 ÷ 9 = ?', a: '9' },
        { q: '14 + 6 = ?', a: '20' },
        { q: '30 - 12 = ?', a: '18' },
        { q: '7 × 9 = ?', a: '63' },
        { q: '64 ÷ 8 = ?', a: '8' },
        { q: '16 + 8 = ?', a: '24' },
        { q: '45 - 20 = ?', a: '25' },
        { q: '3 × 15 = ?', a: '45' },
        { q: '90 ÷ 10 = ?', a: '9' },
        { q: '22 + 18 = ?', a: '40' }
    ],
    متوسط: [
        { q: '15 + 27 = ?', a: '42' },
        { q: '48 - 19 = ?', a: '29' },
        { q: '6 × 8 = ?', a: '48' },
        { q: '144 ÷ 12 = ?', a: '12' },
        { q: '23 + 17 = ?', a: '40' },
        { q: '35 + 45 = ?', a: '80' },
        { q: '83 - 27 = ?', a: '56' },
        { q: '12 × 9 = ?', a: '108' },
        { q: '256 ÷ 16 = ?', a: '16' },
        { q: '47 + 36 = ?', a: '83' },
        { q: '72 - 34 = ?', a: '38' },
        { q: '15 × 7 = ?', a: '105' },
        { q: '324 ÷ 18 = ?', a: '18' },
        { q: '56 + 48 = ?', a: '104' },
        { q: '93 - 47 = ?', a: '46' },
        { q: '18 × 6 = ?', a: '108' },
        { q: '275 ÷ 25 = ?', a: '11' },
        { q: '67 + 54 = ?', a: '121' },
        { q: '112 - 38 = ?', a: '74' },
        { q: '14 × 12 = ?', a: '168' },
        { q: '384 ÷ 24 = ?', a: '16' },
        { q: '89 + 76 = ?', a: '165' },
        { q: '145 - 67 = ?', a: '78' },
        { q: '23 × 8 = ?', a: '184' },
        { q: '672 ÷ 28 = ?', a: '24' },
        { q: '157 + 248 = ?', a: '405' },
        { q: '356 - 189 = ?', a: '167' },
        { q: '32 × 15 = ?', a: '480' },
        { q: '864 ÷ 36 = ?', a: '24' },
        { q: '276 + 345 = ?', a: '621' },
        { q: '543 - 278 = ?', a: '265' },
        { q: '45 × 12 = ?', a: '540' },
        { q: '936 ÷ 24 = ?', a: '39' },
        { q: '789 + 456 = ?', a: '1245' },
        { q: '876 - 543 = ?', a: '333' }
    ],
    صعب: [
        { q: '25 × 12 = ?', a: '300' },
        { q: '144 ÷ 12 + 15 = ?', a: '27' },
        { q: '50 × 8 - 120 = ?', a: '280' },
        { q: '360 ÷ 9 = ?', a: '40' },
        { q: '125 + 375 ÷ 5 = ?', a: '200' },
        { q: '15 × 24 + 36 = ?', a: '396' },
        { q: '480 ÷ 16 - 12 = ?', a: '18' },
        { q: '75 × 8 - 125 = ?', a: '475' },
        { q: '900 ÷ 25 + 16 = ?', a: '52' },
        { q: '250 + 150 × 3 = ?', a: '700' },
        { q: '18 × 27 - 56 = ?', a: '430' },
        { q: '720 ÷ 36 + 48 = ?', a: '68' },
        { q: '125 × 8 - 250 = ?', a: '750' },
        { q: '600 ÷ 30 + 125 = ?', a: '145' },
        { q: '350 + 175 × 4 = ?', a: '1050' },
        { q: '32 × 18 - 76 = ?', a: '500' },
        { q: '840 ÷ 42 + 67 = ?', a: '87' },
        { q: '225 × 6 - 400 = ?', a: '950' },
        { q: '500 ÷ 25 + 180 = ?', a: '200' },
        { q: '420 + 280 × 3 = ?', a: '1260' },
        { q: '48 × 16 - 268 = ?', a: '500' },
        { q: '960 ÷ 32 + 78 = ?', a: '108' },
        { q: '175 × 7 - 345 = ?', a: '880' },
        { q: '840 ÷ 28 + 156 = ?', a: '186' },
        { q: '560 + 240 × 5 = ?', a: '1760' },
        { q: '56 × 21 - 376 = ?', a: '800' },
        { q: '1080 ÷ 45 + 89 = ?', a: '113' },
        { q: '320 × 9 - 540 = ?', a: '2340' },
        { q: '750 ÷ 25 + 230 = ?', a: '260' },
        { q: '680 + 320 × 6 = ?', a: '2600' },
        { q: '75 × 32 - 400 = ?', a: '2000' },
        { q: '1280 ÷ 64 + 135 = ?', a: '155' },
        { q: '280 × 15 - 1200 = ?', a: '3000' },
        { q: '900 ÷ 36 + 275 = ?', a: '300' },
        { q: '840 + 360 × 7 = ?', a: '3360' },
        { q: '45 × 42 - 690 = ?', a: '1200' },
        { q: '1440 ÷ 72 + 248 = ?', a: '268' },
        { q: '520 × 8 - 1640 = ?', a: '2520' },
        { q: '960 ÷ 48 + 320 = ?', a: '340' },
        { q: '720 + 280 × 9 = ?', a: '3240' }
    ]
};

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🧮 فـعـالـيـة الـريـاضـيـات 🧮\n`;
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

module.exports = {
    command: 'رياضة',
    description: '🧮 فعالية أسئلة رياضيات مع نقاط ورتب',
    usage: '.رياضة [سهل | متوسط | صعب]',
    category: 'فعاليات',

    async execute(sock, m) {
        try {
            const chatId = m.key.remoteJid;
            const sender = m.key.participant || m.participant || m.key.remoteJid;

            // استخراج الأمر
            const fullText = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/).slice(1);
            const level = (args[0] || '').trim();

            if (!['سهل', 'متوسط', 'صعب'].includes(level)) {
                await sendMessage(sock, chatId, [
                    '❌ *مستوى غير صحيح*',
                    '',
                    '📌 *المستويات المتاحة:*',
                    '🟢 `.رياضة سهل` - 15 ثانية',
                    '🟡 `.رياضة متوسط` - 20 ثانية',
                    '🔴 `.رياضة صعب` - 30 ثانية',
                    '',
                    '💰 *المكافآت:*',
                    'سهل: +50 نقطة | -50 نقطة',
                    'متوسط: +100 نقطة | -100 نقطة',
                    'صعب: +200 نقطة | -200 نقطة'
                ], m, [sender]);
                return;
            }

            const qa = mathQuestions[level][Math.floor(Math.random() * mathQuestions[level].length)];
            const correct = qa.a.trim();

            // ===== إرسال السؤال =====
            await sendMessage(sock, chatId, [
                '🧮 *سؤال رياضيات* 🔥',
                '',
                `👁️‍🗨️ *المستوى:* ${level}`,
                '',
                `❓ ${qa.q}`,
                '',
                `⏳ ${timeMap[level] / 1000} ثانية للإجابة`,
                `💰 +${rewardMap[level]} | ❌ -${penaltyMap[level]}`
            ], m, [sender]);

            const points = loadJSON(pointsPath, {});
            const ranks = loadJSON(ranksPath, {});
            let ended = false;

            // ===== معالج الإجابات =====
            const handler = async ({ messages }) => {
                for (const msg of messages) {
                    if (ended) return;
                    if (msg.key.remoteJid !== chatId) continue;

                    const txt = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                    if (!txt) continue;

                    if (txt.trim() === correct) {
                        ended = true;
                        clearTimeout(timeout);
                        sock.ev.off('messages.upsert', handler);

                        const winner = msg.key.participant || msg.participant || msg.key.remoteJid;
                        points[winner] = (points[winner] || 0) + rewardMap[level];
                        ranks[winner] = (ranks[winner] || 0) + 1;

                        saveJSON(pointsPath, points);
                        saveJSON(ranksPath, ranks);

                        await sendMessage(sock, chatId, [
                            '✅ *إجابة صحيحة!*',
                            '',
                            `🏆 @${winner.split('@')[0]}`,
                            `✅ الإجابة: *${qa.a}*`,
                            '',
                            `💰 نقاطك: ${points[winner]}`,
                            `🎖️ رتبتك: ${getLevel(points[winner])}`,
                            `📊 عدد الإجابات الصحيحة: ${ranks[winner]}`
                        ], m, [winner]);
                        return;
                    }
                }
            };

            sock.ev.on('messages.upsert', handler);

            // ===== مهلة الوقت =====
            const timeout = setTimeout(async () => {
                if (ended) return;
                ended = true;
                sock.ev.off('messages.upsert', handler);

                points[sender] = (points[sender] || 0) - penaltyMap[level];
                saveJSON(pointsPath, points);

                await sendMessage(sock, chatId, [
                    '⌛ *انتهى الوقت!*',
                    '',
                    `📌 الإجابة الصحيحة: *${qa.a}*`,
                    '',
                    `❌ تم خصم ${penaltyMap[level]} نقطة`,
                    `📊 نقاطك الحالية: ${points[sender] || 0}`,
                    '',
                    '🎯 حاول مرة أخرى في المرة القادمة'
                ], m, [sender]);
            }, timeMap[level]);

        } catch (error) {
            console.error('❌ خطأ في أمر رياضة:', error);
            await sendMessage(sock, m.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], m);
        }
    }
};