// قنابل.js - لعبة القنبلة الجماعية (نسخة محسنة بدون خطوط)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

if (!fs.existsSync(path.dirname(pointsPath))) {
    fs.mkdirSync(path.dirname(pointsPath), { recursive: true });
}
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));

function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

function getLevel(points) {
    if (points >= 10000) return '🦁 LEGEND';
    if (points >= 1000) return '💎 PRO';
    if (points >= 500) return '🔥 ADVANCED';
    if (points >= 200) return '🌱 JUNIOR';
    return '🐣 BEGINNER';
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `💣 لـعـبـة الـقـنـبـلـة 💣\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ========== حالة الألعاب النشطة ==========
const activeGames = new Map();

// ========== دالة إنهاء اللعبة ==========
async function cancelGame(sock, chatId, reason, penalty = false, silent = false) {
    const game = activeGames.get(chatId);
    if (!game) return;

    if (penalty && game.players.length > 0) {
        const points = loadJSON(pointsPath);
        const penaltyLines = [
            '❌ *تم إلغاء القنبلة!*',
            `📝 السبب: ${reason}`,
            ''
        ];
        for (const player of game.players) {
            points[player] = (points[player] || 0) - 10;
            penaltyLines.push(`📉 @${player.split('@')[0]} : ${points[player]} نقطة (خصم 10)`);
        }
        saveJSON(pointsPath, points);
        await sendMessage(sock, chatId, penaltyLines, null, game.players);
    } else if (!silent) {
        await sendMessage(sock, chatId, [
            '❌ *تم إلغاء القنبلة!*',
            `📝 السبب: ${reason}`
        ], null, game.players);
    }

    if (game.timer) clearTimeout(game.timer);
    if (game.registrationTimeout) clearTimeout(game.registrationTimeout);
    if (game.messageHandlerOff) game.messageHandlerOff();
    activeGames.delete(chatId);
}

// ========== دالة الانفجار ==========
async function explode(sock, chatId) {
    const game = activeGames.get(chatId);
    if (!game || !game.isActive) return;

    const playerId = game.current;
    clearTimeout(game.timer);
    game.isActive = false;

    // خصم 50 نقطة
    const points = loadJSON(pointsPath);
    let userPoints = points[playerId] || 0;
    userPoints = Math.max(0, userPoints - 50);
    points[playerId] = userPoints;
    saveJSON(pointsPath, points);
    const rank = getLevel(userPoints);

    const mentionName = playerId.split('@')[0];
    const lines = [
        `💥 *انفجررر!*`,
        `@${mentionName} كانت القنبلة معاه وما قدرش يرميها في الوقت! 🔥`,
        `📉 خسر *50* نقطة!`,
        `💰 رصيدك: ${userPoints} | 🏅 ${rank}`,
        '',
        `🔄 اكتب .قنابل عشان تلعب تاني.`
    ];

    await sendMessage(sock, chatId, lines, null, [playerId]);

    await cancelGame(sock, chatId, 'انفجرت القنبلة', false, true);
}

// ========== دالة بدء التايمر ==========
function startTimer(sock, chatId) {
    const game = activeGames.get(chatId);
    if (!game) return;

    if (game.timer) clearTimeout(game.timer);

    game.timer = setTimeout(async () => {
        const currentGame = activeGames.get(chatId);
        if (currentGame && currentGame.isActive) {
            await explode(sock, chatId);
        }
    }, 5000);
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: 'قنابل',
    description: '💣 لعبة القنبلة الجماعية (انضم، بدأ، نقل)',
    category: 'فعاليات',
    usage: '.قنابل',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            if (!chatId.endsWith('@g.us')) {
                await sendMessage(sock, chatId, [
                    '❌ هذا الأمر يعمل فقط في المجموعات.'
                ], msg);
                return;
            }

            if (activeGames.has(chatId)) {
                await sendMessage(sock, chatId, [
                    '⚠️ توجد لعبة نشطة بالفعل.',
                    '📌 يمكنك الانضمام بكتابة `انضم`',
                    '📌 أو الانسحاب بـ `انسحب`'
                ], msg);
                return;
            }

            // ========== إعداد اللعبة الجديدة ==========
            const newGame = {
                status: 'registering',
                players: [sender],
                current: null,
                isActive: false,
                timer: null,
                registrationTimeout: null,
                messageHandlerOff: null
            };
            activeGames.set(chatId, newGame);

            // رسالة الترحيب
            await sendMessage(sock, chatId, [
                `✅ @${sender.split('@')[0]} أنشأ اللعبة! (العدد: 1)`,
                '',
                '🎤 فترة التسجيل: 30 ثانية',
                '✍️ اكتب `انضم` للمشاركة',
                '⚠️ يلزم وجود لاعبين على الأقل',
                '💣 بعد البدأ، القنبلة تنتقل بـ `نقل @منشن`',
                '⏰ معاك 5 ثواني عشان تمررها، وإلا تنفجر وتخسر 50 نقطة',
                '🚪 للانسحاب: `انسحب`'
            ], msg, [sender]);

            // ========== معالج الرسائل ==========
            const messageHandler = async ({ messages }) => {
                const game = activeGames.get(chatId);
                if (!game) return;

                for (const m of messages) {
                    const senderMsg = m.key.participant || m.participant || m.key.remoteJid;
                    if (senderMsg === sock.user.id) continue;
                    if (m.key.remoteJid !== chatId) continue;

                    const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                    if (!txt.trim()) continue;
                    const content = txt.trim().toLowerCase();

                    // --- مرحلة التسجيل ---
                    if (game.status === 'registering') {
                        if (content === 'انضم') {
                            if (game.players.includes(senderMsg)) {
                                await sendMessage(sock, chatId, [
                                    `⚠️ @${senderMsg.split('@')[0]} أنت مشترك بالفعل.`
                                ], m, [senderMsg]);
                                continue;
                            }
                            game.players.push(senderMsg);
                            await sendMessage(sock, chatId, [
                                `✅ @${senderMsg.split('@')[0]} انضم!`,
                                `👥 العدد: ${game.players.length}`
                            ], m, [senderMsg]);
                        }
                        continue;
                    }

                    // --- مرحلة اللعب ---
                    if (game.status === 'playing') {
                        // الانسحاب
                        if (content === 'انسحب') {
                            const idx = game.players.indexOf(senderMsg);
                            if (idx !== -1) {
                                game.players.splice(idx, 1);
                                await sendMessage(sock, chatId, [
                                    `🚪 @${senderMsg.split('@')[0]} انسحب.`,
                                    `👥 المتبقي: ${game.players.length}`
                                ], m, [senderMsg]);
                                if (game.players.length < 2) {
                                    await cancelGame(sock, chatId, 'أصبح عدد اللاعبين أقل من 2.', false);
                                    return;
                                }
                                // لو كان المنسحب هو حامل القنبلة، ننقلها لعشوائي
                                if (game.current === senderMsg && game.isActive) {
                                    const remaining = game.players.filter(p => p !== senderMsg);
                                    if (remaining.length > 0) {
                                        game.current = remaining[Math.floor(Math.random() * remaining.length)];
                                        await sendMessage(sock, chatId, [
                                            `🔄 القنبلة اتنقلت تلقائياً لـ @${game.current.split('@')[0]}`
                                        ], null, [game.current]);
                                        startTimer(sock, chatId);
                                    }
                                }
                            } else {
                                await sendMessage(sock, chatId, [
                                    `⚠️ @${senderMsg.split('@')[0]} لست مشاركاً.`
                                ], m, [senderMsg]);
                            }
                            continue;
                        }

                        // --- بدأ اللعبة ---
                        if (content === 'بدأ' && !game.isActive) {
                            if (game.players.length < 2) {
                                await sendMessage(sock, chatId, [
                                    '❌ لازم على الأقل *2 لاعبين* عشان تبدء.'
                                ], m);
                                continue;
                            }
                            game.isActive = true;
                            const randomIndex = Math.floor(Math.random() * game.players.length);
                            game.current = game.players[randomIndex];

                            let playerList = [];
                            game.players.forEach((p, i) => {
                                playerList.push(`${i+1}. @${p.split('@')[0]}`);
                            });

                            const lines = [
                                `🎮 *بدأنا اللعبة!*`,
                                '',
                                '👥 اللاعبين:',
                                ...playerList,
                                '',
                                `💣 القنبلة دلوقتي مع: *@${game.current.split('@')[0]}*`,
                                `⏳ معاك *5 ثواني* عشان تمررها بـ \`نقل @منشن\``
                            ];
                            await sendMessage(sock, chatId, lines, m, game.players);

                            startTimer(sock, chatId);
                            continue;
                        }

                        // --- نقل القنبلة ---
                        if (content.startsWith('نقل') && game.isActive) {
                            // التأكد أن المرسل هو حامل القنبلة
                            if (game.current !== senderMsg) {
                                await sendMessage(sock, chatId, [
                                    '❌ مش دورك! استنى لما القنبلة توصل لك.'
                                ], m);
                                continue;
                            }

                            // استخراج المنشن
                            const contextInfo = m.message?.extendedTextMessage?.contextInfo;
                            const mentioned = contextInfo?.mentionedJid || [];
                            if (mentioned.length === 0) {
                                await sendMessage(sock, chatId, [
                                    '⚠️ لازم تمنشن الشخص اللي عايز تحدف له القنبلة!',
                                    '📝 مثال: `نقل @اسمه`'
                                ], m);
                                continue;
                            }

                            const target = mentioned[0];
                            if (!game.players.includes(target)) {
                                await sendMessage(sock, chatId, [
                                    '❌ الشخص ده مش في اللعبة! اختار واحد من اللاعبين.'
                                ], m);
                                continue;
                            }
                            if (target === senderMsg) {
                                await sendMessage(sock, chatId, [
                                    '😅 مش هينفع تحددها لنفسك! اختار حد تاني.'
                                ], m);
                                continue;
                            }

                            // ---- تمرير ناجح ----
                            clearTimeout(game.timer);

                            // مكافأة +5 نقاط للمرسل
                            const points = loadJSON(pointsPath);
                            points[senderMsg] = (points[senderMsg] || 0) + 5;
                            saveJSON(pointsPath, points);

                            // تحديث الحامل
                            game.current = target;

                            const lines = [
                                `🏃‍♂️ *@${senderMsg.split('@')[0]}* رمى القنبلة لـ *@${target.split('@')[0]}*! 💣`,
                                `⏳ معاك *5 ثواني* عشان ترميها (اكتب \`نقل @منشن\`).`,
                                `💰 @${senderMsg.split('@')[0]} كسب *+5* نقاط على التمريرة! 🎉`
                            ];
                            await sendMessage(sock, chatId, lines, m, [senderMsg, target]);

                            startTimer(sock, chatId);
                            continue;
                        }
                    }
                }
            };

            sock.ev.on('messages.upsert', messageHandler);
            newGame.messageHandlerOff = () => sock.ev.off('messages.upsert', messageHandler);

            // ========== مؤقت انتهاء التسجيل ==========
            newGame.registrationTimeout = setTimeout(async () => {
                const game = activeGames.get(chatId);
                if (!game || game.status !== 'registering') return;
                if (game.players.length < 2) {
                    await cancelGame(sock, chatId, 'لم ينضم عدد كافٍ من اللاعبين (يلزم 2).', false);
                    return;
                }
                game.status = 'playing';
                await sendMessage(sock, chatId, [
                    '✅ تم التسجيل!',
                    `👥 عدد اللاعبين: ${game.players.length}`,
                    '📌 اكتب `بدأ` لبدء القنبلة.'
                ], null, game.players);
            }, 30000);

        } catch (error) {
            console.error('✗ خطأ في أمر قنابل:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};