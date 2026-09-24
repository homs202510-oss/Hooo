// ديث.js - فعالية ديث نوت (نسخة محسنة بدون خطوط)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

if (!fs.existsSync(__dirname)) fs.mkdirSync(__dirname, { recursive: true });
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

// ========== أسئلة ديث نوت ==========
const questions = [
    { text: 'من هو حامل دفتر الموت الأصلي؟', answer: 'لايت' },
    { text: 'من هو المحقق الذي يواجه لايت؟', answer: 'ال' },
    { text: 'ما اسم الشينيغامي الذي أعطى لايت الدفتر؟', answer: 'ريوك' },
    { text: 'من هي عشيقة لايت التي تعمل معه؟', answer: 'ميسا' },
    { text: 'من هو والد لايت؟', answer: 'سويتشيرو' },
    { text: 'من هي والدة لايت؟', answer: 'ساتشيكو' },
    { text: 'من هي أخت لايت؟', answer: 'سايوكو' },
    { text: 'من هو مساعد إل الأول؟', answer: 'واتاري' },
    { text: 'من هما الخليفتان اللتان اختارهما إل قبل موته؟', answer: 'نيار وميلو' },
    { text: 'من هو الخليفة الثاني لـ L؟', answer: 'نيار' },
    { text: 'من هو الخليفة الثالث الذي يتحدى نيار؟', answer: 'ميلو' },
    { text: 'من هي مساعدة ميلو؟', answer: 'هالي' },
    { text: 'من هو الشينيغامي المرتبط بميسا؟', answer: 'رم' },
    { text: 'من الذي قتل إل في النهاية؟', answer: 'ريم' },
    { text: 'من هو الشينيغامي الآخر الذي ظهر مع ريوك؟', answer: 'شيدو' },
    { text: 'كم عدد القواعد التي كتبها ريوك في دفتر الموت؟', answer: '5' },
    { text: 'ما هي المدة التي يموت فيها الشخص بعد كتابة اسمه؟', answer: '40 ثانية' },
    { text: 'ما الذي يحدث إذا لم تحدد سبب الموت خلال 40 ثانية؟', answer: 'يموت بنوبة قلبية' },
    { text: 'كم مرة يمكن تغيير سبب الموت؟', answer: '6 مرات' },
    { text: 'من هو المجرم الأول الذي قتله لايت؟', answer: 'كيرو كورودا' },
    { text: 'ما هو الاسم المستعار الذي اتخذه لايت كـ "كيرو"؟', answer: 'كيرو' },
    { text: 'كم عدد ضحايا كيرا في أول أسبوع؟', answer: '12' },
    { text: 'من هو أول محقق يلاحظ نمط وفيات المجرمين؟', answer: 'إل' },
    { text: 'ما هو الاختبار الذي وضعه إل لتضييق نطاق المشتبه بهم؟', answer: 'إعلان تلفزيوني مزيف' },
    { text: 'من الذي أرسل شريط الفيديو إلى محطة التلفزيون؟', answer: 'لايت' },
    { text: 'من كان ضحية الاختبار الأولى لإل بعد أن أرسل الشريط؟', answer: 'ليند إل تايلور' },
    { text: 'من هو أول شخص يشك في أن لايت هو كيرا؟', answer: 'إل' },
    { text: 'في أي حلقة يلتقي إل ولايت وجهاً لوجه لأول مرة؟', answer: '2' },
    { text: 'ما هو الاختبار الذي استخدمه إل على لايت أثناء اجتماعهما الأول؟', answer: 'كتابة أسماء المجرمين' },
    { text: 'من هي أول شخصية رئيسية تموت في ديث نوت؟', answer: 'واتاري' },
    { text: 'كيف مات واتاري؟', answer: 'أضرم النار في نفسه' },
    { text: 'من هو كيرا الثاني؟', answer: 'ميسا' },
    { text: 'من الذي أخبر ميسا أن لايت هو كيرا؟', answer: 'ريم' },
    { text: 'ما هو اسم الفرقة الموسيقية التي كانت ميسا عضوة فيها؟', answer: 'إم تي أم' },
    { text: 'من هو المدير التنفيذي لشركة يومي للبث؟', answer: 'يوكي شيبيمورا' },
    { text: 'من هو المذيع الذي استخدمه كيرا لإرسال رسائله؟', answer: 'ديميجاوا' },
    { text: 'من هو قائد فريق المهمة الخاص التابع للأمم المتحدة؟', answer: 'إل' },
    { text: 'كم عدد أعضاء فريق المهمة الخاص؟', answer: '5' },
    { text: 'ما اسم قرص الحاسوب الذي استخدمه إل لتتبع كيرا؟', answer: 'قرص إل' },
    { text: 'من هو المخبر الذي تجسس على لايت في الجامعة؟', answer: 'أهارو' },
    { text: 'ما هو اسم زميلة لايت في الجامعة التي أحبته؟', answer: 'كيومي' },
    { text: 'من هي زوجة لايت المستقبلية التي تزوجها بعد أن أصبح كيرا؟', answer: 'ميسا' },
    { text: 'في أي عام يبدأ أنمي ديث نوت؟', answer: '2006' },
    { text: 'كم عدد حلقات أنمي ديث نوت؟', answer: '37' },
    { text: 'ما هي نهاية لايت ياغامي؟', answer: 'يموت' },
    { text: 'من يكتب اسم لايت في دفتر الموت في النهاية؟', answer: 'ريوك' },
    { text: 'أين مات لايت؟', answer: 'درج قديم' },
    { text: 'من هو الشخص الذي دفع لايت نحو الجنون؟', answer: 'إل' },
    { text: 'ما هي العبارة التي قالها لايت قبل موته؟', answer: 'اللعنة' },
    { text: 'من هو الشخص الذي أخذ دفتر الموت بعد موت لايت؟', answer: 'ريوك' },
    { text: 'كم عدد أجزاء مانغا ديث نوت؟', answer: '12' },
    { text: 'من هو مؤلف قصة ديث نوت؟', answer: 'تسوغومي أوبا' },
    { text: 'من هو رسام ديث نوت？', answer: 'تاكيشي أوباتا' },
    { text: 'في أي مجلة نُشرت ديث نوت؟', answer: 'شونن جمب' },
    { text: 'كم عدد الأفلام المقتبسة من ديث نوت؟', answer: '4' },
    { text: 'ما هي الهدية التي أعطتها ريم لميسا؟', answer: 'دفتر الموت' },
    { text: 'ما هو الشيء الوحيد الذي يمكن أن يقتل الشينيغامي؟', answer: 'حب إنسان' },
    { text: 'ما هي قاعدة الشينيغامي التي تجعلهم يموتون؟', answer: 'إطالة عمر إنسان' },
    { text: 'من هو الشينيغامي الذي أحب ميسا فمات من أجلها؟', answer: 'ريم' }
];

function normalize(str) {
    return str.trim().replace(/[أإآ]/g, 'ا').replace(/[ى]/g, 'ي').replace(/\s+/g, ' ').toLowerCase();
}

function isMatching(input, target) {
    return normalize(input) === normalize(target);
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `📓 ديـث نـوت 📓\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

const activeGames = new Map();

// ========== إلغاء اللعبة ==========
async function cancelGame(sock, chatId, reason, penalty = false, silent = false) {
    const game = activeGames.get(chatId);
    if (!game) return;

    if (penalty && game.playersList && game.playersList.length) {
        const points = loadJSON(pointsPath);
        const lines = [
            '❌ *تم إلغاء الفعالية!*',
            `📝 السبب: ${reason}`,
            ''
        ];
        for (const player of game.playersList) {
            points[player] = (points[player] || 0) - 10;
            lines.push(`📉 @${player.split('@')[0]} : ${points[player]} نقطة (خصم 10)`);
        }
        saveJSON(pointsPath, points);
        await sendMessage(sock, chatId, lines, null, game.playersList);
    } else if (!silent) {
        await sendMessage(sock, chatId, [
            '❌ *تم إلغاء الفعالية!*',
            `📝 السبب: ${reason}`
        ]);
    }

    if (game.roundTimeout) clearTimeout(game.roundTimeout);
    if (game.registrationTimeout) clearTimeout(game.registrationTimeout);
    if (game.listener) sock.ev.off('messages.upsert', game.listener);
    activeGames.delete(chatId);
}

// ========== عرض المشاركين ==========
function formatParticipants(playersMap) {
    const lines = [];
    for (const [id, data] of Object.entries(playersMap)) {
        const status = data.alive ? '✅' : '💀';
        lines.push(`🍒 @${id.split('@')[0]} ${status}`);
    }
    return lines;
}

// ========== بدء جولة جديدة ==========
async function startNewRound(sock, chatId) {
    const game = activeGames.get(chatId);
    if (!game || game.status !== 'playing') return;

    const question = questions[Math.floor(Math.random() * questions.length)];
    game.currentQuestion = question;
    game.roundActive = true;
    game.roundFinished = false;

    const lines = [
        '📖 *سؤال ديث نوت*',
        '',
        `❓ ${question.text}`,
        '',
        `⏳ الوقت: 30 ثانية`,
        `🏆 الجائزة: 50 نقطة`,
        `💔 الخسارة: -20 نقطة`,
        '',
        `👥 المشاركون: ${game.playersList.length}`
    ];

    await sendMessage(sock, chatId, lines);

    if (game.roundTimeout) clearTimeout(game.roundTimeout);
    game.roundTimeout = setTimeout(async () => {
        const cur = activeGames.get(chatId);
        if (cur && cur.status === 'playing' && cur.roundActive && !cur.roundFinished) {
            cur.roundActive = false;
            await sendMessage(sock, chatId, [
                '⏰ انتهى الوقت!',
                '',
                '📌 إعادة السؤال...'
            ]);
            startNewRound(sock, chatId);
        }
    }, 30000);
}

// ========== اختيار الضحية ==========
async function selectVictim(sock, chatId, winnerId) {
    const game = activeGames.get(chatId);
    if (!game || game.status !== 'playing') return;

    const alivePlayers = game.playersList.filter(p => p !== winnerId);
    if (alivePlayers.length === 0) {
        await sendMessage(sock, chatId, [
            '⚠️ لا يوجد لاعبين لطردهم!',
            '🏆 أنت الفائز!'
        ]);
        const finalPoints = loadJSON(pointsPath);
        finalPoints[winnerId] = (finalPoints[winnerId] || 0) + 700;
        saveJSON(pointsPath, finalPoints);
        await cancelGame(sock, chatId, 'فوز');
        return;
    }

    game.status = 'selecting';
    game.waitingWinner = winnerId;
    game.victimsList = alivePlayers;

    const lines = [
        `👑 @${winnerId.split('@')[0]} اختر ضحية لطردها:`,
        '',
        ...alivePlayers.map((p, i) => `${i+1}. @${p.split('@')[0]}`),
        '',
        `📝 اكتب الرقم (1-${alivePlayers.length})`
    ];

    await sendMessage(sock, chatId, lines, null, [winnerId, ...alivePlayers]);

    if (game.selectionTimeout) clearTimeout(game.selectionTimeout);
    game.selectionTimeout = setTimeout(async () => {
        const cur = activeGames.get(chatId);
        if (cur && cur.status === 'selecting') {
            // اختيار عشوائي
            const randomVictim = cur.victimsList[Math.floor(Math.random() * cur.victimsList.length)];
            cur.playersMap[randomVictim].alive = false;
            cur.playersList = cur.playersList.filter(p => p !== randomVictim);
            await sendMessage(sock, chatId, [
                `⏰ انتهى الوقت! تم اختيار @${randomVictim.split('@')[0]} عشوائياً 💀`
            ], null, [randomVictim]);

            if (cur.playersList.length === 1) {
                const winner = cur.playersList[0];
                const finalPoints = loadJSON(pointsPath);
                finalPoints[winner] = (finalPoints[winner] || 0) + 700;
                saveJSON(pointsPath, finalPoints);
                await sendMessage(sock, chatId, [
                    `🏆 *انتهت الفعالية!*`,
                    `👑 الفائز: @${winner.split('@')[0]}`,
                    `💰 +700 نقطة`
                ], null, [winner]);
                await cancelGame(sock, chatId, 'انتهت اللعبة');
            } else {
                cur.status = 'playing';
                cur.roundActive = false;
                cur.roundFinished = false;
                cur.currentQuestion = null;
                await startNewRound(sock, chatId);
            }
        }
    }, 15000);
}

// ========== الأمر الرئيسي ==========
module.exports = {
    command: 'ديث',
    description: '📓 فعالية ديث نوت – تنافس، أسئلة، إقصاء، آخر من يبقى يفوز',
    category: 'فعاليات',
    usage: '.ديث',

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
                    '⚠️ هناك فعالية نشطة بالفعل.',
                    '📌 يمكنك الانضمام بكتابة `انضم`',
                    '📌 أو الانسحاب بـ `انسحب`'
                ], msg);
                return;
            }

            const newGame = {
                status: 'registering',
                playersMap: {},
                playersList: [sender],
                currentQuestion: null,
                roundActive: false,
                roundFinished: false,
                roundTimeout: null,
                registrationTimeout: null,
                selectionTimeout: null,
                waitingWinner: null,
                victimsList: [],
                listener: null
            };
            newGame.playersMap[sender] = { alive: true, score: 0 };
            activeGames.set(chatId, newGame);

            const lines = [
                `✅ @${sender.split('@')[0]} أنشأ الفعالية!`,
                `👥 عدد المشاركين: 1`,
                '',
                '📓 *فعالية ديث نوت*',
                '',
                '📌 أول من يجيب على السؤال يحصل على نقطة',
                '📌 ويحق له طرد شخص من الفعالية',
                '📌 آخر من يبقى يفوز بـ 700 نقطة',
                '',
                '🎤 فترة التسجيل: 30 ثانية',
                '✍️ اكتب `انضم` للمشاركة'
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

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

                    // مرحلة التسجيل
                    if (game.status === 'registering') {
                        if (content === 'انضم') {
                            if (game.playersMap[senderMsg]) {
                                await sendMessage(sock, chatId, [
                                    `⚠️ @${senderMsg.split('@')[0]} أنت مشترك بالفعل.`
                                ], m, [senderMsg]);
                                continue;
                            }
                            game.playersMap[senderMsg] = { alive: true, score: 0 };
                            game.playersList.push(senderMsg);
                            await sendMessage(sock, chatId, [
                                `✅ @${senderMsg.split('@')[0]} انضم!`,
                                `👥 العدد: ${game.playersList.length}`
                            ], m, [senderMsg]);
                        }
                        continue;
                    }

                    // مرحلة اللعب
                    if (game.status === 'playing') {
                        // الانسحاب
                        if (content === 'انسحب') {
                            if (!game.playersMap[senderMsg] || !game.playersMap[senderMsg].alive) {
                                await sendMessage(sock, chatId, [
                                    `⚠️ @${senderMsg.split('@')[0]} لست مشاركاً أو تم إقصاؤك.`
                                ], m, [senderMsg]);
                                continue;
                            }
                            const points = loadJSON(pointsPath);
                            points[senderMsg] = (points[senderMsg] || 0) - 50;
                            saveJSON(pointsPath, points);
                            game.playersMap[senderMsg].alive = false;
                            game.playersList = game.playersList.filter(p => p !== senderMsg);
                            await sendMessage(sock, chatId, [
                                `🚪 @${senderMsg.split('@')[0]} انسحب (-50 نقطة)`,
                                `💰 رصيدك: ${points[senderMsg]} نقطة`
                            ], m, [senderMsg]);

                            if (game.playersList.length === 1) {
                                const winner = game.playersList[0];
                                const finalPoints = loadJSON(pointsPath);
                                finalPoints[winner] = (finalPoints[winner] || 0) + 700;
                                saveJSON(pointsPath, finalPoints);
                                await sendMessage(sock, chatId, [
                                    `🏆 *انتهت الفعالية!*`,
                                    `👑 الفائز: @${winner.split('@')[0]}`,
                                    `💰 +700 نقطة`
                                ], null, [winner]);
                                await cancelGame(sock, chatId, 'انتهت اللعبة');
                            } else if (game.playersList.length === 0) {
                                await cancelGame(sock, chatId, 'لم يبق أي لاعب');
                            } else {
                                startNewRound(sock, chatId);
                            }
                            continue;
                        }

                        // الإجابة على السؤال
                        if (game.roundActive && !game.roundFinished && game.currentQuestion) {
                            if (!game.playersMap[senderMsg] || !game.playersMap[senderMsg].alive) continue;

                            if (isMatching(txt, game.currentQuestion.answer)) {
                                game.roundActive = false;
                                game.roundFinished = true;
                                if (game.roundTimeout) clearTimeout(game.roundTimeout);

                                const points = loadJSON(pointsPath);
                                points[senderMsg] = (points[senderMsg] || 0) + 50;
                                game.playersMap[senderMsg].score += 50;
                                saveJSON(pointsPath, points);

                                await sendMessage(sock, chatId, [
                                    `✅ *إجابة صحيحة!* 🎉`,
                                    `👑 @${senderMsg.split('@')[0]} حصل على 50 نقطة`,
                                    `🔥 الآن يمكنه طرد أحد المشاركين!`
                                ], m, [senderMsg]);

                                await selectVictim(sock, chatId, senderMsg);
                                return;
                            } else {
                                const points = loadJSON(pointsPath);
                                points[senderMsg] = (points[senderMsg] || 0) - 20;
                                saveJSON(pointsPath, points);
                                await sendMessage(sock, chatId, [
                                    `❌ @${senderMsg.split('@')[0]} إجابة خاطئة! -20 نقطة`
                                ], m, [senderMsg]);
                            }
                        }
                    }

                     // مرحلة اختيار الضحية
                    if (game.status === 'selecting') {
                        if (senderMsg !== game.waitingWinner) continue;

                        const num = parseInt(content);
                        if (isNaN(num) || num < 1 || num > game.victimsList.length) {
                            await sendMessage(sock, chatId, [
                                `⚠️ اختر رقماً صحيحاً من 1 إلى ${game.victimsList.length}`
                            ], m, [senderMsg]);
                            continue;
                        }

                        const victim = game.victimsList[num - 1];
                        if (game.selectionTimeout) clearTimeout(game.selectionTimeout);

                        game.playersMap[victim].alive = false;
                        game.playersList = game.playersList.filter(p => p !== victim);

                        await sendMessage(sock, chatId, [
                            `💀 *تم طرد @${victim.split('@')[0]} بواسطة @${senderMsg.split('@')[0]}!*`,
                            `📓 يخرج من اللعبة.`
                        ], null, [victim, senderMsg]);

                        if (game.playersList.length === 1) {
                            const winner = game.playersList[0];
                            const finalPoints = loadJSON(pointsPath);
                            finalPoints[winner] = (finalPoints[winner] || 0) + 700;
                            saveJSON(pointsPath, finalPoints);
                            await sendMessage(sock, chatId, [
                                `🏆 *انتهت الفعالية!*`,
                                `👑 الفائز: @${winner.split('@')[0]}`,
                                `💰 +700 نقطة`
                            ], null, [winner]);
                            await cancelGame(sock, chatId, 'انتهت اللعبة');
                        } else {
                            game.status = 'playing';
                            game.roundActive = false;
                            game.roundFinished = false;
                            game.currentQuestion = null;
                            await startNewRound(sock, chatId);
                        }
                        return;
                    }
                }
            };

            sock.ev.on('messages.upsert', messageHandler);
            newGame.listener = messageHandler;

            // ========== مؤقت التسجيل ==========
            newGame.registrationTimeout = setTimeout(async () => {
                const game = activeGames.get(chatId);
                if (!game || game.status !== 'registering') return;

                if (game.playersList.length < 2) {
                    await cancelGame(sock, chatId, 'لم ينضم عدد كافٍ من اللاعبين (يلزم 2).');
                    return;
                }

                game.status = 'playing';
                await sendMessage(sock, chatId, [
                    '🎬 *بدأت اللعبة!*',
                    `👥 عدد المشاركين: ${game.playersList.length}`
                ]);
                await startNewRound(sock, chatId);
            }, 30000);

        } catch (error) {
            console.error('✗ خطأ في أمر ديث:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};