// اكتب.js - فعالية كتابة تنافسية (مع تجاهل رسائل البوت)

const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const gameStatePath = path.join(__dirname, 'db-writingGame.json');

if (!fs.existsSync(__dirname)) fs.mkdirSync(__dirname, { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(gameStatePath)) fs.writeFileSync(gameStatePath, JSON.stringify({}, null, 2));

function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

function getLevel(points) {
    if (points >= 10000) return '🦁 LEGEND';
    if (points >= 1000) return '💎 PRO';
    if (points >= 500) return '🔥 ADVANCED';
    if (points >= 200) return '🌱 JUNIOR';
    return '🙂 BEGINNER';
}

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `✍️ فـعـالـيـة الـكـتـابـة ✍️\n`;
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

// ========== قائمة الجمل المطلوب كتابتها (موسعة) ==========
const writingTasks = [
    // أساسية
    'أنا ملك التحدي',
    'القلب الأزرق يفوز',
    'بسرعة الصاروخ',
    'ماكيمة أسطورة',
    'فوز لا يوقف',
    'الدماغ السريع',
    'الرد السريع',
    'أسرع من البرق',
    'تركيز خارق',
    'أنت مدعو للفوز',
    'لا أحد يسبقني',
    'هدفنا القمة',
    // إضافات
    'القوة في الإرادة',
    'التحدي يبدأ من هنا',
    'أنت البطل الحقيقي',
    'الفوز حليفي الدائم',
    'لا مستحيل مع الإصرار',
    'الحلم يبدأ بخطوة',
    'النجاح ليس صدفة',
    'كن أنت التغيير',
    'طريق الألف ميل يبدأ بخطوة',
    'العزيمة تصنع المعجزات',
    'لا تيأس أبداً',
    'القادم أجمل',
    'أنت أقوى مما تظن',
    'النجاح ينتظرك',
    'كل يوم فرصة جديدة',
    'أنا القمة',
    'لا شيء مستحيل',
    'اجعل هدفك القمر',
    'تحدى نفسك دائماً',
    'كن الأفضل في كل شيء',
    'الثقة مفتاح النجاح',
    'الإرادة تصنع المستحيل',
    'لا تتردد أبداً',
    'أنت الفائز الحقيقي',
    'الطموح لا حدود له',
    'حقق حلمك اليوم',
    'المستقبل بين يديك',
    'أنت أسطورة في صنعها',
    'كل شيء ممكن',
    'النجاح رحلة وليس وجهة',
    'كن شجاعاً دائماً',
    'التحدي غذاء الروح',
    'أنت مبدع بالفطرة',
    'لا وقت للفشل',
    'اجعل اليوم أفضل من الأمس',
    'كن قدوة للآخرين',
    'العظمة تكمن في داخلك'
];

function normalize(str) {
    return str.trim()
        .replace(/[أإآ]/g, 'ا')
        .replace(/[ى]/g, 'ي')
        .replace(/\s+/g, ' ')
        .toLowerCase();
}
function isMatching(input, target) {
    return normalize(input) === normalize(target);
}

function updateScoreboard(game) {
    let board = '📊 *لوحة المتصدرين* 📊\n\n';
    const sorted = [...game.players].sort((a, b) => (game.scores[b] || 0) - (game.scores[a] || 0));
    for (const p of sorted) {
        const score = game.scores[p] || 0;
        board += `👤 @${p.split('@')[0]} : ${score} / 10\n`;
    }
    board += `\n🏆 أول من يصل إلى 10 نقاط يفوز بـ 700 نقطة!`;
    return board;
}

const activeGames = new Map();

async function cancelGame(sock, chatId, reason, penalty = false, silent = false) {
    const game = activeGames.get(chatId);
    if (!game) return;
    if (penalty && game.players.length > 0) {
        const points = loadJSON(pointsPath);
        let penaltyLines = ['❌ *تم إلغاء الفعالية!*', `📝 السبب: ${reason}`, ''];
        for (const player of game.players) {
            points[player] = (points[player] || 0) - 10;
            penaltyLines.push(`📉 @${player.split('@')[0]} : ${points[player]} نقطة (خصم 10)`);
        }
        saveJSON(pointsPath, points);
        await sendMessage(sock, chatId, penaltyLines, null, game.players);
    } else if (!silent) {
        await sendMessage(sock, chatId, ['❌ *تم إلغاء الفعالية!*', `📝 السبب: ${reason}`]);
    }
    if (game.roundTimeout) clearTimeout(game.roundTimeout);
    if (game.registrationTimeout) clearTimeout(game.registrationTimeout);
    if (game.messageHandlerOff) game.messageHandlerOff();
    activeGames.delete(chatId);
}

module.exports = {
    command: 'اكتب',
    description: '✍️ فعالية كتابة تنافسية (اكتب الجملة المطلوبة أولاً)',
    category: 'فعاليات',
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        if (activeGames.has(chatId)) {
            await sendMessage(sock, chatId, [
                '⚠️ *يوجد فعالية نشطة*',
                '',
                '📌 يمكنك الانضمام بكتابة `انضم`',
                '📌 أو الانسحاب بـ `انسحب`'
            ], msg);
            return;
        }

        const newGame = {
            status: 'registering',
            players: [sender],
            scores: { [sender]: 0 },
            startTime: Date.now(),
            currentTask: null,
            roundActive: false,
            roundFinished: false,
            roundTimeout: null,
            registrationTimeout: null,
            messageHandlerOff: null
        };
        activeGames.set(chatId, newGame);

        await sendMessage(sock, chatId, [
            `✅ @${sender.split('@')[0]} أنشأ الفعالية! (عدد المشاركين: 1)`
        ], msg, [sender]);

        const registerLines = [
            '🎤 *فترة التسجيل:* 30 ثانية',
            '✍️ اكتب `انضم` للمشاركة',
            '⚠️ *يلزم وجود لاعبين على الأقل لبدء اللعبة*',
            '📝 سيتم طرح جملة، أول من يكتبها يفوز بنقطة',
            '🏆 كل إجابة صحيحة = نقطة في السباق',
            '🥇 أول من يجمع 10 نقاط يفوز بـ *700 نقطة*',
            '⏰ المهلة 60 ثانية → خصم 10 نقاط من كل مشارك وإلغاء الفعالية',
            '🚪 للانسحاب أثناء اللعب: `انسحب`'
        ];
        await sendMessage(sock, chatId, registerLines, msg, [sender]);

        const messageHandler = async ({ messages }) => {
            for (const m of messages) {
                const senderMsg = m.key.participant || m.participant || m.key.remoteJid;
                if (senderMsg === sock.user.id) continue;
                if (m.key.remoteJid !== chatId) continue;

                const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                if (!txt.trim()) continue;
                const content = txt.trim().toLowerCase();
                const game = activeGames.get(chatId);
                if (!game) continue;

                // مرحلة التسجيل
                if (game.status === 'registering') {
                    if (content === 'انضم') {
                        if (game.players.includes(senderMsg)) {
                            await sendMessage(sock, chatId, [
                                `⚠️ @${senderMsg.split('@')[0]} أنت مشترك بالفعل.`
                            ], m, [senderMsg]);
                            continue;
                        }
                        game.players.push(senderMsg);
                        game.scores[senderMsg] = 0;
                        await sendMessage(sock, chatId, [
                            `✅ @${senderMsg.split('@')[0]} انضم إلى الفعالية! (العدد: ${game.players.length})`
                        ], m, [senderMsg]);
                    }
                    continue;
                }

                // مرحلة اللعب
                if (game.status === 'playing') {
                    // الانسحاب
                    if (content === 'انسحب') {
                        const idx = game.players.indexOf(senderMsg);
                        if (idx !== -1) {
                            game.players.splice(idx, 1);
                            delete game.scores[senderMsg];
                            await sendMessage(sock, chatId, [
                                `🚪 @${senderMsg.split('@')[0]} انسحب من الفعالية. (المتبقي: ${game.players.length})`
                            ], m, [senderMsg]);
                            if (game.players.length < 2) {
                                await cancelGame(sock, chatId, 'أصبح عدد اللاعبين أقل من 2.', false);
                                return;
                            }
                            await sendMessage(sock, chatId, [updateScoreboard(game)], null, game.players);
                        } else {
                            await sendMessage(sock, chatId, [
                                `⚠️ @${senderMsg.split('@')[0]}، أنت لست مشاركاً.`
                            ], m, [senderMsg]);
                        }
                        continue;
                    }

                    // الإجابة على الجملة المطلوبة
                    if (game.roundActive === true && !game.roundFinished && game.currentTask) {
                        if (!game.players.includes(senderMsg)) {
                            continue; // تجاهل غير المشاركين
                        }

                        if (isMatching(txt, game.currentTask)) {
                            game.scores[senderMsg] = (game.scores[senderMsg] || 0) + 1;
                            const newScore = game.scores[senderMsg];
                            await sendMessage(sock, chatId, [
                                `✅ @${senderMsg.split('@')[0]} كتب الجملة الصحيحة! +1 نقطة.`,
                                `📊 رصيدك: ${newScore}/10`
                            ], m, [senderMsg]);

                            if (newScore >= 10) {
                                const points = loadJSON(pointsPath);
                                const finalReward = 700;
                                points[senderMsg] = (points[senderMsg] || 0) + finalReward;
                                saveJSON(pointsPath, points);
                                await sendMessage(sock, chatId, [
                                    `🏆 *@${senderMsg.split('@')[0]} حقق 10 نقاط وفاز بالفعالية النهائية!* 🏆`,
                                    `🎉 الجائزة: +${finalReward} نقطة! 🎉`,
                                    `💰 رصيدك الآن: ${points[senderMsg]} نقطة`,
                                    `🏅 رتبتك: ${getLevel(points[senderMsg])}`
                                ], null, [senderMsg]);
                                await cancelGame(sock, chatId, 'انتهت الفعالية بفوز لاعب.', false, true);
                                return;
                            }

                            clearTimeout(game.roundTimeout);
                            game.roundActive = false;
                            game.roundFinished = true;
                            await startNewRound(sock, chatId);
                        }
                    }
                }
            }
        };

        sock.ev.on('messages.upsert', messageHandler);
        newGame.messageHandlerOff = () => sock.ev.off('messages.upsert', messageHandler);

        const registrationTimeout = setTimeout(async () => {
            const game = activeGames.get(chatId);
            if (!game || game.status !== 'registering') return;
            if (game.players.length < 2) {
                await cancelGame(sock, chatId, 'لم ينضم عدد كافٍ من اللاعبين (يلزم لاعبين على الأقل).', false);
                return;
            }
            game.status = 'playing';
            await startNewRound(sock, chatId);
        }, 30000);
        newGame.registrationTimeout = registrationTimeout;

        async function startNewRound(sock, chatId) {
            const game = activeGames.get(chatId);
            if (!game || game.status !== 'playing') return;

            const task = writingTasks[Math.floor(Math.random() * writingTasks.length)];
            game.currentTask = task;
            game.roundActive = true;
            game.roundFinished = false;

            const scoreboard = updateScoreboard(game);

            const roundLines = [
                '📝 *الجملة المطلوبة:*',
                `"${task}"`,
                '',
                `👥 المشاركون: ${game.players.length}`,
                `⏳ الوقت: 60 ثانية`,
                `✅ أول من يكتب الجملة الصحيحة يحصل على نقطة`,
                '',
                scoreboard,
                '',
                '✍️ أجب بكتابة الجملة كاملة',
                '🚪 للانسحاب: `انسحب`'
            ];

            await sendMessage(sock, chatId, roundLines, null, game.players);

            const roundTimeout = setTimeout(async () => {
                const currentGame = activeGames.get(chatId);
                if (currentGame && currentGame.status === 'playing' && currentGame.roundActive === true && !currentGame.roundFinished) {
                    await cancelGame(sock, chatId, 'انتهت المهلة (60 ثانية) دون إجابة صحيحة.', true);
                }
            }, 60000);

            if (game.roundTimeout) clearTimeout(game.roundTimeout);
            game.roundTimeout = roundTimeout;
        }
    }
};