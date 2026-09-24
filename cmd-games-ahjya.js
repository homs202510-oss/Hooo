// احجية.js - لعبة حجر، ورقة، مقص (نسخة محسنة)

const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

if (!fs.existsSync(path.dirname(pointsPath))) {
    fs.mkdirSync(path.dirname(pointsPath), { recursive: true });
}
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));

function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// ========== دالة تنسيق الأرقام ==========
function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    num = Math.floor(num);
    if (num >= 1e15) return '∞';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + ' تريليون';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + ' مليار';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + ' مليون';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + ' ألف';
    return num.toString();
}

function getLevel(points) {
    if (points >= 10000) return '🦁 LEGEND';
    if (points >= 1000) return '💎 PRO';
    if (points >= 500) return '🔥 ADVANCED';
    if (points >= 200) return '🌱 JUNIOR';
    return '🙂 BEGINNER';
}

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

// ========== دالة الإرسال بتنسيق موحد ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎮 حـجـر ✦ ورقـة ✦ مـقـص 🎮\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    
    await sock.sendMessage(chatId, { 
        text: msg, 
        mentions 
    }, { 
        quoted: quoted 
    });
}

// ========== دالة عرض الشرح ==========
async function showHelp(sock, chatId, quoted = null) {
    const lines = [
        `🎯 *قواعد اللعبة*`,
        ``,
        `📌 *الهدف:*`,
        `   الفوز بـ 5 جولات من 5`,
        ``,
        `🎮 *الاختيارات:*`,
        `   🪨 حجر  →  يكسـر  ✂️ مقص`,
        `   📄 ورقة →  يغطي  🪨 حجر`,
        `   ✂️ مقص  →  يقطع  📄 ورقة`,
        ``,
        `🤖 *البوت يختار عشوائياً:*`,
        `   • حجر 🪨`,
        `   • ورقة 📄`,
        `   • مقص ✂️`,
        ``,
        `📊 *النتائج:*`,
        `   ✅ فوز → +1 نقطة`,
        `   ❌ خسارة → 0 نقطة`,
        `   🔄 تعادل → 0 نقطة`,
        ``,
        `💰 *الجوائز النهائية:*`,
        `   🏆 5/5 فوز → +300 نقطة`,
        `   💀 أي خسارة → -200 نقطة`,
        `   🚪 الانسحاب → -100 نقطة`,
        `   ⏳ انتهاء المهلة → -50 نقطة`,
        ``,
        `📝 *طريقة اللعب:*`,
        `   1️⃣ اكتب .احجية لبدء اللعبة`,
        `   2️⃣ اختر: حجر / ورقة / مقص`,
        `   3️⃣ البوت يختار عشوائياً 🤖`,
        `   4️⃣ تظهر النتيجة فوراً`,
        `   5️⃣ العب 5 جولات`,
        `   6️⃣ احصل على الجائزة 🎁`,
        ``,
        `💡 *نصيحة:*`,
        `   • فكر قبل أن تختار!`,
        `   • البوت يلعب عشوائياً`,
        `   • لا يوجد نمط ثابت 🧠`
    ];
    
    await sendMessage(sock, chatId, lines, quoted);
}

// ========== دالة عرض نتيجة الجولة ==========
function getRoundResult(playerChoice, botChoice, result) {
    let resultEmoji = '';
    let resultText = '';
    
    if (result === 'فوز') {
        resultEmoji = '✅';
        resultText = 'فوز';
    } else if (result === 'خسارة') {
        resultEmoji = '❌';
        resultText = 'خسارة';
    } else {
        resultEmoji = '🔄';
        resultText = 'تعادل';
    }
    
    return {
        emoji: resultEmoji,
        text: resultText,
        display: `${resultEmoji} ${resultText}`
    };
}

const choices = ['حجر', 'ورقة', 'مقص'];
const emojis = { حجر: '🪨', ورقة: '📄', مقص: '✂️' };

function getResult(player, bot) {
    if (player === bot) return 'تعادل';
    if (
        (player === 'حجر' && bot === 'مقص') ||
        (player === 'ورقة' && bot === 'حجر') ||
        (player === 'مقص' && bot === 'ورقة')
    ) return 'فوز';
    return 'خسارة';
}

const shortComments = {
    فوز: { حجر: '🪨💥✂️', ورقة: '📄🛡️🪨', مقص: '✂️✂️📄' },
    خسارة: { حجر: '📄🛡️🪨', ورقة: '✂️✂️📄', مقص: '🪨💥✂️' },
    تعادل: { حجر: '🪨🔄🪨', ورقة: '📄🔄📄', مقص: '✂️🔄✂️' }
};

const activeGames = new Map();

// ========== إنهاء اللعبة ==========
async function endGame(sock, chatId, reason, penalty = 0) {
    const game = activeGames.get(chatId);
    if (!game) return;
    if (game.roundTimeout) clearTimeout(game.roundTimeout);
    if (game.messageHandlerOff) game.messageHandlerOff();

    const points = loadJSON(pointsPath);
    let lines = [];
    
    if (penalty > 0) {
        points[game.player] = (points[game.player] || 0) - penalty;
        saveJSON(pointsPath, points);
        const formattedPoints = formatNumber(points[game.player] || 0);
        lines = [
            `⛔ ${reason}`,
            `📉 -${penalty} نقطة`,
            `💰 الرصيد: ${formattedPoints} نقطة`
        ];
    } else {
        lines = [`❌ ${reason}`];
    }
    
    await sendMessage(sock, chatId, lines, null, [game.player]);
    activeGames.delete(chatId);
}

// ========== إنهاء اللعبة بنتيجة ==========
async function finishGame(sock, chatId) {
    const game = activeGames.get(chatId);
    if (!game) return;
    if (game.roundTimeout) clearTimeout(game.roundTimeout);
    if (game.messageHandlerOff) game.messageHandlerOff();

    const points = loadJSON(pointsPath);
    let lines = [];
    
    if (game.score >= 5) {
        points[game.player] = (points[game.player] || 0) + 300;
        saveJSON(pointsPath, points);
        const formattedPoints = formatNumber(points[game.player] || 0);
        const rank = getLevel(points[game.player]);
        lines = [
            `🏆 *فوز! 5/5* 🎉`,
            `🎁 +300 نقطة`,
            `💰 الرصيد: ${formattedPoints} نقطة`,
            `🏅 المستوى: ${rank}`
        ];
    } else {
        points[game.player] = (points[game.player] || 0) - 200;
        saveJSON(pointsPath, points);
        const formattedPoints = formatNumber(points[game.player] || 0);
        lines = [
            `💀 *خسرت ${game.score}/5*`,
            `📉 -200 نقطة`,
            `💰 الرصيد: ${formattedPoints} نقطة`
        ];
    }
    
    await sendMessage(sock, chatId, lines, null, [game.player]);
    activeGames.delete(chatId);
}

// ========== بدء جولة ==========
async function startRound(sock, chatId, previousResult = null, isFirst = false) {
    const game = activeGames.get(chatId);
    if (!game) return;

    if (game.round >= 5) {
        await finishGame(sock, chatId);
        return;
    }

    game.round++;
    game.roundFinished = false;
    game.botChoice = choices[Math.floor(Math.random() * choices.length)];

    let lines = [];

    if (isFirst) {
        lines.push(`🎯 *اللاعب:* @${game.player.split('@')[0]}`);
        lines.push(`━━━━━━━━━━━━━━━━━━━━`);
        lines.push(`📌 *عدد الجولات:* 5`);
        lines.push(`🏆 *الفوز:* +300 نقطة`);
        lines.push(`💀 *الخسارة:* -200 نقطة`);
        lines.push(`🚪 *الانسحاب:* -100 نقطة`);
        lines.push(`⏳ *المهلة:* -50 نقطة`);
        lines.push(`━━━━━━━━━━━━━━━━━━━━`);
        lines.push(`💡 *للحصول على الشرح:*`);
        lines.push(`   اكتب .شرح_احجية`);
    }

    if (previousResult) {
        lines.push(previousResult);
        lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    }

    const progress = '▰'.repeat(game.score) + '▱'.repeat(5 - game.score);
    lines.push(`🔁 *الجولة:* ${game.round}/5`);
    lines.push(`🏅 *النقاط:* ${game.score}/5 ${progress}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`📝 *اختر:* حجر / ورقة / مقص`);
    lines.push(`⏳ *الوقت:* 30 ثانية`);

    await sendMessage(sock, chatId, lines, null, [game.player]);

    if (game.roundTimeout) clearTimeout(game.roundTimeout);
    game.roundTimeout = setTimeout(async () => {
        const currentGame = activeGames.get(chatId);
        if (!currentGame || currentGame.roundFinished) return;
        await endGame(sock, chatId, '⏳ انتهت المهلة', 50);
    }, 30000);
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['احجية'],
    description: '🎮 لعبة حجر، ورقة، مقص (5 جولات)',
    category: 'العاب',
    
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        // ===== قراءة النص =====
        const fullText = msg.message?.conversation || 
                        msg.message?.extendedTextMessage?.text || '';

        // ===== شرح اللعبة =====
        if (fullText.includes('شرح') || fullText.includes('help') || fullText.includes('كيف')) {
            await showHelp(sock, chatId, msg);
            return;
        }

        // ===== التحقق من وجود لعبة نشطة =====
        if (activeGames.has(chatId)) {
            await sendMessage(sock, chatId, [
                '⚠️ *يوجد لعبة نشطة*',
                '',
                '📌 انتظر حتى تنتهي اللعبة الحالية',
                '📌 أو اكتب "انسحب" للانسحاب'
            ], msg);
            return;
        }

        // ===== بدء لعبة جديدة =====
        const newGame = {
            player: sender,
            round: 0,
            score: 0,
            botChoice: null,
            roundTimeout: null,
            roundFinished: false,
            messageHandlerOff: null
        };
        activeGames.set(chatId, newGame);

        await startRound(sock, chatId, null, true);

        const messageHandler = async ({ messages }) => {
            const game = activeGames.get(chatId);
            if (!game) return;

            for (const m of messages) {
                // ===== تجاهل رسائل البوت نفسه =====
                const senderMsg = m.key.participant || m.participant || m.key.remoteJid;
                if (senderMsg === sock.user.id) continue;
                
                // ===== تجاهل الرسائل من خارج الجروب =====
                if (m.key.remoteJid !== chatId) continue;

                // ===== تجاهل كل من ليس اللاعب =====
                if (senderMsg !== game.player) {
                    continue;
                }

                // ===== هنا فقط رسائل اللاعب =====
                if (game.roundFinished) {
                    await sendMessage(sock, chatId, ['⏳ *انتظر دورك*'], m);
                    continue;
                }

                const txt = getMessageText(m);
                if (!txt.trim()) continue;
                const content = txt.trim().toLowerCase();

                // ===== انسحاب =====
                if (content === 'انسحب' || content === 'انسحاب') {
                    await endGame(sock, chatId, '🚪 انسحبت', 100);
                    return;
                }

                // ===== شرح =====
                if (content === 'شرح' || content === 'help' || content === 'كيف') {
                    await showHelp(sock, chatId, m);
                    continue;
                }

                // ===== اختيار غير صحيح =====
                if (!choices.includes(content)) {
                    await sendMessage(sock, chatId, [
                        '⚠️ *اختر من الخيارات التالية:*',
                        '',
                        '🪨 حجر',
                        '📄 ورقة',
                        '✂️ مقص'
                    ], m);
                    continue;
                }

                // ===== تنفيذ الجولة =====
                game.roundFinished = true;
                clearTimeout(game.roundTimeout);

                const playerChoice = content;
                const botChoice = game.botChoice;
                const result = getResult(playerChoice, botChoice);
                const emojiResult = shortComments[result]?.[playerChoice] || '';
                const resultInfo = getRoundResult(playerChoice, botChoice, result);

                if (result === 'فوز') game.score += 1;

                // ===== بناء رسالة النتيجة =====
                const resultLines = [
                    `━━━━━━━━━━━━━━━━━━━━`,
                    `🎯 *اختيارك:* ${emojis[playerChoice]} ${playerChoice}`,
                    `🤖 *اختيار البوت:* ${emojis[botChoice]} ${botChoice}`,
                    `━━━━━━━━━━━━━━━━━━━━`,
                    `📊 *النتيجة:* ${resultInfo.emoji} ${resultInfo.text}`,
                    `${emojiResult}`,
                    `━━━━━━━━━━━━━━━━━━━━`,
                    `🏅 *النقاط:* ${game.score}/5`
                ];

                // ===== إرسال نتيجة الجولة =====
                await sendMessage(sock, chatId, resultLines, m);

                // ===== بدء الجولة التالية =====
                await startRound(sock, chatId, null, false);
            }
        };

        sock.ev.on('messages.upsert', messageHandler);
        newGame.messageHandlerOff = () => sock.ev.off('messages.upsert', messageHandler);
    }
};