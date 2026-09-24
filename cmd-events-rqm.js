// guessNumber.js - فعالية تخمين الرقم السري (بدون رد على غير المشاركين)

const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
if (!fs.existsSync(__dirname))
    fs.mkdirSync(__dirname, { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, '{}');

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; }
}
function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getLevel(points) {
    if (points >= 10000) return '🦁 LEGEND';
    if (points >= 1000) return '💎 PRO';
    if (points >= 500) return '🔥 ADVANCED';
    if (points >= 200) return '🌱 JUNIOR';
    return '🐣 BEGINNER';
}

async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) lines = [lines];
    let msg = `🎲 خـمـن الـرقـم 🎲\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) msg += `${line}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted });
}

const activeGames = new Map();

module.exports = {
    command: ['ارقام', 'رقم'],
    description: '🎲 خمن الرقم السري بين 1 و 100 مع تلميحات "أكبر/أصغر"',
    category: 'فعاليات',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        if (!chatId.endsWith('@g.us')) {
            await sendMessage(sock, chatId, ['❌ هذا الأمر فقط في المجموعات.'], msg);
            return;
        }

        if (activeGames.has(chatId)) {
            await sendMessage(sock, chatId, [
                '⚠️ توجد لعبة نشطة بالفعل.',
                '📌 اكتب `انضم` للمشاركة',
                '📌 أو `انسحب` للخروج'
            ], msg);
            return;
        }

        const secretNumber = Math.floor(Math.random() * 100) + 1;
        const game = {
            number: secretNumber,
            participants: [sender],
            guesses: {},
            startTime: Date.now(),
            started: false,
            finished: false,
            listener: null,
            gameTimeout: null,
            registrationTimeout: null
        };
        game.guesses[sender] = 0;
        activeGames.set(chatId, game);

        // ===== رسالة البداية =====
        await sendMessage(sock, chatId, [
            `🎯 *فعالية تخمين الرقم السري*`,
            ``,
            `🔢 لدي رقم بين *1* و *100* في ذهني!`,
            `📌 اكتشفه عبر التخمين.`,
            ``,
            `📝 *القواعد:*`,
            `• اكتب \`انضم\` خلال 30 ثانية للمشاركة`,
            `• أرسل رقمًا للتخمين (مثال: \`50\`)`,
            `• سأرد بـ "أكبر" أو "أصغر"`,
            `• أول من يخمن الرقم الصحيح يفوز بـ *300 نقطة*`,
            `• كل تخمين خاطئ = -5 نقاط`,
            `• انتهاء الوقت = -50 نقطة لكل مشارك`,
            ``,
            `⏳ فترة التسجيل: 30 ثانية`,
            `⏰ مدة اللعبة: 3 دقائق`,
            `💰 الجائزة: 300 نقطة`
        ], msg, [sender]);

        // ===== معالج الرسائل =====
        const handler = async ({ messages }) => {
            const gameNow = activeGames.get(chatId);
            if (!gameNow || gameNow.finished) return;

            for (const m of messages) {
                if (m.key.remoteJid !== chatId) continue;
                const senderMsg = m.key.participant || m.participant || m.key.remoteJid;
                if (senderMsg === sock.user.id) continue;

                const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                if (!txt.trim()) continue;
                const content = txt.trim().toLowerCase();

                // ----- مرحلة التسجيل (أول 30 ثانية) -----
                if (!gameNow.started) {
                    // نسمح لأي أحد بالانضمام
                    if (content === 'انضم') {
                        if (gameNow.participants.includes(senderMsg)) {
                            await sendMessage(sock, chatId, [
                                `⚠️ @${senderMsg.split('@')[0]} مسجل بالفعل.`
                            ], m, [senderMsg]);
                        } else {
                            gameNow.participants.push(senderMsg);
                            gameNow.guesses[senderMsg] = 0;
                            await sendMessage(sock, chatId, [
                                `✅ @${senderMsg.split('@')[0]} انضم!`,
                                `👥 عدد المشاركين: ${gameNow.participants.length}`
                            ], m, [senderMsg]);
                        }
                    }
                    continue;
                }

                // ----- بعد بدء اللعبة: نتعامل فقط مع المشاركين -----
                if (gameNow.started && !gameNow.finished) {
                    // تجاهل أي رسالة من غير المشاركين (بدون رد)
                    if (!gameNow.participants.includes(senderMsg)) {
                        continue; // صمت تام
                    }

                    // انسحاب
                    if (content === 'انسحب' || content === 'انسحاب') {
                        const points = loadJSON(pointsPath);
                        points[senderMsg] = (points[senderMsg] || 0) - 50;
                        saveJSON(pointsPath, points);
                        gameNow.participants = gameNow.participants.filter(p => p !== senderMsg);
                        delete gameNow.guesses[senderMsg];
                        await sendMessage(sock, chatId, [
                            `🚪 @${senderMsg.split('@')[0]} انسحب (-50 نقطة)`,
                            `💰 رصيدك: ${points[senderMsg]} نقطة`
                        ], m, [senderMsg]);

                        if (gameNow.participants.length === 0) {
                            gameNow.finished = true;
                            clearTimeout(gameNow.gameTimeout);
                            sock.ev.off('messages.upsert', handler);
                            await sendMessage(sock, chatId, ['❌ لم يبق أي لاعب، تم إنهاء اللعبة.']);
                            activeGames.delete(chatId);
                        }
                        continue;
                    }

                    // تخمين رقم
                    const guess = parseInt(content);
                    if (isNaN(guess) || guess < 1 || guess > 100) {
                        await sendMessage(sock, chatId, [
                            `⚠️ @${senderMsg.split('@')[0]} أرسل رقمًا صحيحًا بين 1 و 100.`
                        ], m, [senderMsg]);
                        continue;
                    }

                    if (guess === gameNow.number) {
                        // فوز
                        gameNow.finished = true;
                        clearTimeout(gameNow.gameTimeout);
                        sock.ev.off('messages.upsert', handler);

                        const points = loadJSON(pointsPath);
                        points[senderMsg] = (points[senderMsg] || 0) + 300;
                        saveJSON(pointsPath, points);

                        await sendMessage(sock, chatId, [
                            `🎉 *إجابة صحيحة!* 🎉`,
                            ``,
                            `🏆 *الفائز:* @${senderMsg.split('@')[0]}`,
                            `🔢 *الرقم كان:* ${gameNow.number}`,
                            `📊 *عدد محاولاتك:* ${gameNow.guesses[senderMsg] + 1}`,
                            ``,
                            `⭐ *المكافأة:* +300 نقطة`,
                            `📊 *رصيدك:* ${points[senderMsg]} نقطة`,
                            `🎖️ *رتبتك:* ${getLevel(points[senderMsg])}`,
                            ``,
                            `🥳 تهانينا!`
                        ], m, [senderMsg]);
                        activeGames.delete(chatId);
                        return;
                    } else {
                        // تخمين خاطئ
                        gameNow.guesses[senderMsg] = (gameNow.guesses[senderMsg] || 0) + 1;
                        const points = loadJSON(pointsPath);
                        points[senderMsg] = (points[senderMsg] || 0) - 5;
                        saveJSON(pointsPath, points);

                        const hint = guess < gameNow.number ? '📈 أكبر' : '📉 أصغر';
                        await sendMessage(sock, chatId, [
                            `❌ @${senderMsg.split('@')[0]} تخمين خاطئ!`,
                            `💡 التلميح: الرقم *${hint}* من ${guess}`
                        ], m, [senderMsg]);
                    }
                }
            }
        };

        sock.ev.on('messages.upsert', handler);
        game.listener = handler;

        // ===== بعد 30 ثانية: بدء اللعبة أو إلغاؤها =====
        game.registrationTimeout = setTimeout(async () => {
            const current = activeGames.get(chatId);
            if (!current || current.finished) return;

            if (current.participants.length === 0) {
                current.finished = true;
                sock.ev.off('messages.upsert', handler);
                await sendMessage(sock, chatId, ['❌ لم ينضم أي لاعب، تم إلغاء الفعالية.']);
                activeGames.delete(chatId);
                return;
            }

            current.started = true;
            await sendMessage(sock, chatId, [
                `🎬 *بدأت اللعبة!*`,
                `👥 المشاركون: ${current.participants.length}`,
                `📤 أرسل رقمًا للتخمين (1-100)`,
                `⏳ المدة: 3 دقائق`
            ]);

            current.gameTimeout = setTimeout(async () => {
                const currentGame = activeGames.get(chatId);
                if (!currentGame || currentGame.finished) return;
                currentGame.finished = true;
                sock.ev.off('messages.upsert', handler);

                const points = loadJSON(pointsPath);
                const lines = [
                    `⏰ *انتهى الوقت!*`,
                    `💡 الرقم كان: *${currentGame.number}*`,
                    `📉 تم خصم 50 نقطة من كل مشارك:`
                ];
                for (const p of currentGame.participants) {
                    points[p] = (points[p] || 0) - 50;
                    lines.push(`   @${p.split('@')[0]} → ${points[p]} نقطة`);
                }
                saveJSON(pointsPath, points);
                await sendMessage(sock, chatId, lines, null, currentGame.participants);
                activeGames.delete(chatId);
            }, 180000);
        }, 30000);
    }
};