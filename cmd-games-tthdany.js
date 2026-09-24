// تحداني.js - فعالية تحديات الأنمي (نسخة مستقرة، تمنع تكرار الإجابات)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const gameStatePath = path.join(__dirname, 'db-challengeGame.json');

if (!fs.existsSync(__dirname)) fs.mkdirSync(__dirname, { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(gameStatePath)) fs.writeFileSync(gameStatePath, JSON.stringify({}, null, 2));

function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

function getLevel(points) {
    if (points >= 10000) return 'LEGEND 🦁';
    if (points >= 1000) return 'PRO 💎';
    if (points >= 500) return 'advanced 🔥';
    if (points >= 200) return 'junior 🌱';
    return 'beginner 🙂';
}

// ===================== قاعدة الأسئلة =====================
const questions = [
    { text: 'هل غوكو هو بطل دراغون بول؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل فريزا هو عدو غوكو الأقوى؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل فيجيتا هو ابن غوكو؟', answer: 'لا', reward: 50, penalty: 20 },
    { text: 'هل بيكولو من عائلة السايان؟', answer: 'لا', reward: 55, penalty: 20 },
    { text: 'هل غوهان هو ابن غوكو؟', answer: 'نعم', reward: 45, penalty: 15 },
    { text: 'هل ترانكس هو ابن فيجيتا؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل سوبر سايان هو تحول غوكو الأول؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل برولي هو سايان شرير؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل سيل هو من دراغون بول؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل ناروتو هو بطل الأنمي؟', answer: 'نعم', reward: 45, penalty: 15 },
    { text: 'هل مات ناروتو في نهاية الجزء الأول؟', answer: 'لا', reward: 50, penalty: 20 },
    { text: 'هل ساسكي هو صديق ناروتو المقرب؟', answer: 'نعم', reward: 45, penalty: 15 },
    { text: 'هل كاكاشي معلم ناروتو؟', answer: 'نعم', reward: 40, penalty: 15 },
    { text: 'هل تيم 7 يتكون من ناروتو وساسكي وساكورا؟', answer: 'نعم', reward: 40, penalty: 15 },
    { text: 'هل الهوكاغي هو قائد القرية؟', answer: 'نعم', reward: 45, penalty: 15 },
    { text: 'هل مادارا هو الخصم الرئيسي؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل جيرايا مات على يد أوروتشيمارو؟', answer: 'لا', reward: 60, penalty: 25 },
    { text: 'هل تسونادي هي الهوكاغي الخامسة؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل الهيناتا تحب ناروتو؟', answer: 'نعم', reward: 45, penalty: 15 },
    { text: 'هل لوفي هو بطل ون بيس؟', answer: 'نعم', reward: 45, penalty: 15 },
    { text: 'هل زورو يستخدم ثلاثة سيوف؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل نامي هي رسامة الخرائط؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل سانجي هو طباخ القراصنة؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل تشوبر هو طبيب سفينة؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل روبين تستطيع قراءة البونغليف؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل فرانكي هو آلي؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل بروك هو موسيقي السفينة؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل جينبي هو حوت قرش؟', answer: 'لا', reward: 60, penalty: 25 },
    { text: 'هل الون بيس هو الكنز العظيم؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل إيتشيغو هو بطل بليتش؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل روكيا هي زميلة إيتشيغو؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل أوريهيمي لديها قوة شفاء؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل تشاد هو صديق إيتشيغو؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل أيزن هو العدو الرئيسي؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل إرين هو بطل الهجوم؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل ميكاسا تحمي إرين؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل أرمين هو صديق إرين؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل ليفاي هو أقوى جندي؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل العمالقة هم أعداء البشر؟', answer: 'نعم', reward: 45, penalty: 15 },
    { text: 'هل غون هو بطل هنتر؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل كيلوا هو صديق غون؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل كورابيكا يريد الانتقام؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل هيسوكا هو عدو غون؟', answer: 'لا', reward: 60, penalty: 25 },
    { text: 'هل ميرويم هو ملك النمل؟', answer: 'نعم', reward: 60, penalty: 25 },
    { text: 'هل غوجو هو أقوى جوجوتسو؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل يوجي هو بطل الجوجوتسو؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل سوكونا هو العدو الرئيسي؟', answer: 'نعم', reward: 60, penalty: 25 },
    { text: 'هل تانجيرو هو بطل القاتل؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل نيزوكو هي أخت تانجيرو؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل زينيتسو يخاف من النساء؟', answer: 'نعم', reward: 60, penalty: 25 },
    { text: 'هل موزان هو ملك الشياطين؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل ميدوريا هو بطل المايهيرو؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل أوراراكا تحب ميدوريا؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل باكاغو هو صديق ميدوريا؟', answer: 'لا', reward: 55, penalty: 20 },
    { text: 'هل أولمايت هو معلم ميدوريا؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل لايت ياغامي هو بطل ديث نوت؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل إل هو المحقق العبقري؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل ميسا تحب لايت؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل ريووك هو شينيغامي؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل الـ Death Note يقتل من يكتب اسمه؟', answer: 'نعم', reward: 45, penalty: 15 },
    { text: 'هل كانيكي هو بطل التوكيو غول؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل توكا هي صديقة كانيكي؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل ناتسو هو بطل فيري تيل؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل لوسي تستخدم مفاتيح الأرواح؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل إيرزا هي أقوى فارسة؟', answer: 'نعم', reward: 55, penalty: 20 },
    { text: 'هل سيتاما هو بطل ون بنش مان؟', answer: 'نعم', reward: 50, penalty: 20 },
    { text: 'هل جارو هو عدو سيتاما؟', answer: 'نعم', reward: 60, penalty: 25 },
    { text: 'هل سايتاما يملك شعوراً？', answer: 'لا', reward: 60, penalty: 25 },
    { text: 'هل جينوس هو تلميذ سايتاما؟', answer: 'نعم', reward: 55, penalty: 20 }
];

// ========== دالة الإرسال بتنسيق موحد ==========
async function sendFancy(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎮 تـحـدي الأنـمـي 🎮\n`;
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

// ========== دالة الإرسال العادية (للرسائل البسيطة) ==========
async function sendMessage(sock, chatId, text, quoted = null, mentions = []) {
    await sock.sendMessage(chatId, { text, mentions, quoted });
}

// ========== لوحة المتصدرين ==========
function updateScoreboard(game) {
    let board = '📊 *لوحة المتصدرين* 📊\n\n';
    const sorted = [...game.players].sort((a, b) => (game.scores[b] || 0) - (game.scores[a] || 0));
    for (const p of sorted) {
        const score = game.scores[p] || 0;
        board += `👤 @${p.split('@')[0]} : ${score} / 10\n`;
    }
    board += `\n🏆 أول من يصل إلى 10 انتصارات يفوز!`;
    return board;
}

const activeGames = new Map();

async function cancelGame(sock, chatId, reason, penalty = false, silent = false) {
    const game = activeGames.get(chatId);
    if (!game) return;
    if (penalty && game.players.length > 0) {
        const points = loadJSON(pointsPath);
        let penaltyLines = [
            '❌ *تم إلغاء التحدي!*',
            `📝 السبب: ${reason}`,
            ''
        ];
        for (const player of game.players) {
            points[player] = (points[player] || 0) - 10;
            penaltyLines.push(`📉 @${player.split('@')[0]} : ${points[player]} نقطة (خصم 10)`);
        }
        saveJSON(pointsPath, points);
        await sendFancy(sock, chatId, penaltyLines, null, game.players);
    } else if (!silent) {
        await sendMessage(sock, chatId, `❌ *تم إلغاء التحدي!*\n📝 السبب: ${reason}`);
    }
    if (game.roundTimeout) clearTimeout(game.roundTimeout);
    if (game.registrationTimeout) clearTimeout(game.registrationTimeout);
    if (game.messageHandlerOff) game.messageHandlerOff();
    activeGames.delete(chatId);
    const gs = loadJSON(gameStatePath);
    delete gs[chatId];
    saveJSON(gameStatePath, gs);
}

module.exports = {
    command: 'تحداني',
    description: '🎮 تحدٍ جماعي أنمي (نعم/لا) – أول من يصل لـ10 نقاط يفوز',
    category: 'العاب',
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        if (activeGames.has(chatId)) {
            await sendMessage(sock, chatId, '⚠️ يوجد تحدٍ نشط بالفعل. يمكنك الانضمام بكتابة `انضم` أو الانسحاب بـ `انسحب`.', msg);
            return;
        }

        const newGame = {
            status: 'registering',
            players: [sender],
            scores: { [sender]: 0 },
            currentRound: null,
            roundActive: false,
            roundFinished: false,
            roundAnswered: false,
            roundTimeout: null,
            registrationTimeout: null,
            messageHandlerOff: null
        };
        activeGames.set(chatId, newGame);

        await sendMessage(sock, chatId, `✅ @${sender.split('@')[0]} أنشأ التحدي! (عدد المشاركين: 1)`, msg, [sender]);

        // ===== رسالة التسجيل بتنسيق جديد =====
        const registerLines = [
            '🔮 *تـحـدي الأنـمـي* 🔮',
            '',
            '🎤 فترة التسجيل: 30 ثانية',
            '✍️ اكتب `انضم` للمشاركة',
            '⚠️ *يلزم وجود لاعبين على الأقل*',
            '🎯 سؤال (نعم/لا) لكل جولة',
            '🏆 كل إجابة صحيحة = نقطة',
            '🥇 أول من يجمع 10 نقاط يفوز بـ 700 نقطة',
            '⏰ المهلة 60 ثانية → خصم 10 نقاط لكل مشارك',
            '🚪 للانسحاب: `انسحب`'
        ];
        await sendFancy(sock, chatId, registerLines, msg, [sender]);

        const messageHandler = async ({ messages }) => {
            const game = activeGames.get(chatId);
            if (!game) return;

            for (const m of messages) {
                if (game.roundAnswered) continue;

                const senderMsg = m.key.participant || m.participant || m.key.remoteJid;
                if (senderMsg === sock.user.id) continue;
                if (m.key.remoteJid !== chatId) continue;

                const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                if (!txt.trim()) continue;
                const content = txt.trim().toLowerCase();

                // مرحلة التسجيل
                if (game.status === 'registering') {
                    if (content === 'انضم') {
                        if (game.players.includes(senderMsg)) {
                            await sendMessage(sock, chatId, `⚠️ @${senderMsg.split('@')[0]} أنت مشترك بالفعل.`, m, [senderMsg]);
                            continue;
                        }
                        game.players.push(senderMsg);
                        game.scores[senderMsg] = 0;
                        await sendMessage(sock, chatId, `✅ @${senderMsg.split('@')[0]} انضم! (العدد: ${game.players.length})`, m, [senderMsg]);
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
                            await sendMessage(sock, chatId, `🚪 @${senderMsg.split('@')[0]} انسحب. (المتبقي: ${game.players.length})`, m, [senderMsg]);
                            if (game.players.length < 2) {
                                await cancelGame(sock, chatId, 'أصبح عدد اللاعبين أقل من 2.', false);
                                return;
                            }
                            await sendMessage(sock, chatId, updateScoreboard(game), null, game.players);
                        } else {
                            await sendMessage(sock, chatId, `⚠️ @${senderMsg.split('@')[0]} لست مشاركاً.`, m, [senderMsg]);
                        }
                        continue;
                    }

                    // الإجابة على السؤال (نعم/لا) فقط أثناء الجولة النشطة
                    if ((content === 'نعم' || content === 'لا') && game.roundActive && !game.roundFinished) {
                        if (!game.players.includes(senderMsg)) {
                            await sendMessage(sock, chatId, `⚠️ @${senderMsg.split('@')[0]} لست مشاركاً.`, m, [senderMsg]);
                            continue;
                        }

                        game.roundAnswered = true;

                        const isCorrect = (content === game.currentRound.question.answer.toLowerCase());
                        if (isCorrect) {
                            game.roundActive = false;
                            game.roundFinished = true;
                            clearTimeout(game.roundTimeout);

                            game.scores[senderMsg] = (game.scores[senderMsg] || 0) + 1;
                            const newScore = game.scores[senderMsg];
                            await sendMessage(sock, chatId, `✅ @${senderMsg.split('@')[0]} إجابة صحيحة! +1 نقطة (${newScore}/10)`, m, [senderMsg]);

                            if (newScore >= 10) {
                                const points = loadJSON(pointsPath);
                                points[senderMsg] = (points[senderMsg] || 0) + 700;
                                saveJSON(pointsPath, points);
                                await sendMessage(sock, chatId, `🏆 *@${senderMsg.split('@')[0]} حقق 10 نقاط وفاز!* 🏆\n🎉 +700 نقطة!`, null, [senderMsg]);
                                await cancelGame(sock, chatId, 'انتهى التحدي بفوز لاعب.', false, true);
                                return;
                            }

                            await startNewRound(sock, chatId);
                        } else {
                            game.roundActive = false;
                            game.roundFinished = true;
                            clearTimeout(game.roundTimeout);
                            const penalty = game.currentRound.question.penalty || 15;
                            const points = loadJSON(pointsPath);
                            points[senderMsg] = (points[senderMsg] || 0) - penalty;
                            saveJSON(pointsPath, points);
                            await sendMessage(sock, chatId, `❌ @${senderMsg.split('@')[0]} إجابة خاطئة! -${penalty} نقطة.\n📊 رصيدك: ${points[senderMsg]} نقطة`, m, [senderMsg]);
                            await startNewRound(sock, chatId);
                        }
                        continue;
                    }
                }
            }
        };

        sock.ev.on('messages.upsert', messageHandler);
        newGame.messageHandlerOff = () => sock.ev.off('messages.upsert', messageHandler);

        newGame.registrationTimeout = setTimeout(async () => {
            const game = activeGames.get(chatId);
            if (!game || game.status !== 'registering') return;
            if (game.players.length < 2) {
                await cancelGame(sock, chatId, 'لم ينضم عدد كافٍ من اللاعبين (يلزم 2).', false);
                return;
            }
            game.status = 'playing';
            await startNewRound(sock, chatId);
        }, 30000);

        async function startNewRound(sock, chatId) {
            const game = activeGames.get(chatId);
            if (!game || game.status !== 'playing') return;

            game.roundAnswered = false;
            const q = questions[Math.floor(Math.random() * questions.length)];
            game.currentRound = { question: q };
            game.roundActive = true;
            game.roundFinished = false;
            const scoreboard = updateScoreboard(game);

            const roundLines = [
                '❓ *جـولـة جـديـدة* ❓',
                '',
                `📜 ${q.text}`,
                `👥 المشاركون: ${game.players.length}`,
                `⏳ الوقت: 60 ثانية`,
                `✅ الإجابة الصحيحة = +1 نقطة`,
                `❌ الإجابة الخاطئة = -${q.penalty} نقطة`,
                '',
                scoreboard,
                '',
                '✨ أجب بـ `نعم` أو `لا` ✨',
                '🚪 للانسحاب: `انسحب`'
            ];
            await sendFancy(sock, chatId, roundLines, null, game.players);

            if (game.roundTimeout) clearTimeout(game.roundTimeout);
            game.roundTimeout = setTimeout(async () => {
                const currentGame = activeGames.get(chatId);
                if (currentGame && currentGame.status === 'playing' && currentGame.roundActive && !currentGame.roundFinished) {
                    await cancelGame(sock, chatId, 'انتهت المهلة (60 ثانية) دون إجابة صحيحة.', true);
                }
            }, 60000);
        }
    }
};