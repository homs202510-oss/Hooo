// اعلام.js - تخمين اسم الدولة من وصف العلم (نسخة محسنة مع مشاركة الأعضاء)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

if (!fs.existsSync(__dirname)) fs.mkdirSync(__dirname, { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));

function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// ========== قاعدة بيانات الأعلام ==========
const flags = [
    { text: '🇸🇦 علم أخضر مكتوب عليه "لا إله إلا الله محمد رسول الله" وسيف', answer: 'السعودية' },
    { text: '🇪🇬 علم أحمر وأبيض وأسود وعليه نسر صلاح الدين', answer: 'مصر' },
    { text: '🇵🇸 علم أبيض وأسود وأخضر وأحمر ومثلث أحمر', answer: 'فلسطين' },
    { text: '🇮🇶 علم أحمر وأبيض وأسود وعليه عبارة "الله أكبر" بالخط الأخضر', answer: 'العراق' },
    { text: '🇸🇾 علم أحمر وأبيض وأسود ونجمتان خضراوان', answer: 'سوريا' },
    { text: '🇯🇴 علم أسود وأبيض وأخضر وأحمر ونجمة سباعية', answer: 'الأردن' },
    { text: '🇱🇧 علم أحمر وأبيض وأخضر وأرزة في المنتصف', answer: 'لبنان' },
    { text: '🇰🇼 علم أخضر وأبيض وأحمر وشبه منحرف أسود', answer: 'الكويت' },
    { text: '🇶🇦 علم عنابي وأبيض مع تسعة أسنان مثلثة', answer: 'قطر' },
    { text: '🇦🇪 علم أحمر وأخضر وأبيض وأسود', answer: 'الإمارات' },
    { text: '🇴🇲 علم أحمر وأبيض وأخضر وخنجر وسيفين', answer: 'عمان' },
    { text: '🇧🇭 علم أحمر وأبيض بخمسة أسنان مثلثة', answer: 'البحرين' },
    { text: '🇩🇿 علم أخضر وأبيض وأحمر وهلال ونجمة', answer: 'الجزائر' },
    { text: '🇲🇦 علم أحمر ونجمة خماسية خضراء', answer: 'المغرب' },
    { text: '🇹🇳 علم أحمر وهلال ونجمة بيضاء داخل دائرة بيضاء', answer: 'تونس' },
    { text: '🇱🇾 علم أحمر وأسود وأخضر وهلال ونجمة', answer: 'ليبيا' },
    { text: '🇸🇩 علم أحمر وأبيض وأسود وأخضر', answer: 'السودان' },
    { text: '🇾🇪 علم أحمر وأبيض وأسود', answer: 'اليمن' },
    { text: '🇸🇴 علم أزرق فاتح ونجمة بيضاء خماسية', answer: 'الصومال' },
    { text: '🇩🇯 علم أزرق وأخضر وأبيض ونجمة حمراء', answer: 'جيبوتي' },
    { text: '🇰🇲 علم أخضر وأصفر وأزرق وأحمر وهلال', answer: 'جزر القمر' },
    { text: '🇲🇷 علم أخضر ونجمة وهلال أصفران', answer: 'موريتانيا' },
    { text: '🇪🇷 علم أحمر وأزرق وأخضر وإكليل زيتون', answer: 'إريتريا' },
    { text: '🇹🇷 علم أحمر وهلال ونجمة بيضاء', answer: 'تركيا' },
    { text: '🇮🇷 علم أخضر وأبيض وأحمر وعليه شعار الله', answer: 'إيران' },
    { text: '🇦🇫 علم أسود وأحمر وأخضر وشعار أبيض', answer: 'أفغانستان' },
    { text: '🇵🇰 علم أخضر وأبيض وهلال ونجمة', answer: 'باكستان' },
    { text: '🇮🇳 علم برتقالي وأبيض وأخضر وعجلة زرقاء', answer: 'الهند' },
    { text: '🇨🇳 علم أحمر ونجوم صفراء', answer: 'الصين' },
    { text: '🇯🇵 علم أبيض ودائرة حمراء', answer: 'اليابان' },
    { text: '🇰🇷 علم أبيض وأسود وأحمر وأزرق', answer: 'كوريا الجنوبية' },
    { text: '🇺🇸 علم أحمر وأبيض وأزرق ونجوم وخطوط', answer: 'أمريكا' },
    { text: '🇬🇧 علم أزرق وأحمر وأبيض (يونيون جاك)', answer: 'بريطانيا' },
    { text: '🇫🇷 علم أزرق وأبيض وأحمر (ثلاثة ألوان عمودية)', answer: 'فرنسا' },
    { text: '🇩🇪 علم أسود وأحمر وأصفر', answer: 'ألمانيا' },
    { text: '🇮🇹 علم أخضر وأبيض وأحمر', answer: 'إيطاليا' },
    { text: '🇪🇸 علم أحمر وأصفر وأحمر وشعار', answer: 'إسبانيا' },
    { text: '🇷🇺 علم أبيض وأزرق وأحمر (ثلاثة ألوان أفقية)', answer: 'روسيا' },
    { text: '🇧🇷 علم أخضر وأصفر وأزرق وأبيض وعليه "Ordem e Progresso"', answer: 'البرازيل' },
    { text: '🇦🇷 علم أزرق فاتح وأبيض وشمس', answer: 'الأرجنتين' },
    { text: '🇨🇦 علم أحمر وأبيض وورقة قيقب حمراء', answer: 'كندا' },
    { text: '🇦🇺 علم أزرق ونجوم بيضاء ويونيون جاك', answer: 'أستراليا' },
    { text: '🇳🇬 علم أخضر وأبيض وأخضر', answer: 'نيجيريا' },
    { text: '🇿🇦 علم متعدد الألوان (أسود وأصفر وأخضر وأبيض وأزرق وأحمر)', answer: 'جنوب أفريقيا' },
    { text: '🇲🇽 علم أخضر وأبيض وأحمر وعليه نسر وأفعى', answer: 'المكسيك' },
    { text: '🇨🇺 علم أحمر وأبيض وأزرق ونجمة بيضاء', answer: 'كوبا' },
    { text: '🇵🇷 علم أحمر وأبيض وأزرق ونجمة بيضاء', answer: 'بورتوريكو' },
    { text: '🇨🇱 علم أبيض وأزرق وأحمر ونجمة بيضاء', answer: 'تشيلي' },
    { text: '🇨🇴 علم أصفر وأزرق وأحمر', answer: 'كولومبيا' },
    { text: '🇻🇪 علم أصفر وأزرق وأحمر ونجوم', answer: 'فنزويلا' },
    { text: '🇵🇪 علم أحمر وأبيض وأحمر', answer: 'بيرو' }
];

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🏁 فـعـالـيـة أعـرف الـعـلـم 🏁\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

const activeGames = new Map();

module.exports = {
    command: ['اعلام'],
    description: '🏁 تخمين اسم الدولة من وصف العلم (مع مشاركة الأعضاء)',
    category: 'فعاليات',
    usage: '.اعلام',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

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

            // جلب أعضاء المجموعة للمشاركة
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants
                .filter(p => p.id !== sock.user.id)
                .map(p => p.id);

            if (participants.length < 2) {
                await sendMessage(sock, chatId, [
                    '❌ عدد الأعضاء غير كافٍ (يلزم عضوين على الأقل).'
                ], msg);
                return;
            }

            const newGame = {
                status: 'registering',
                players: [sender],
                scores: { [sender]: 0 },
                startTime: Date.now(),
                currentFlag: null,
                roundActive: false,
                roundFinished: false,
                roundTimeout: null,
                registrationTimeout: null,
                allPlayers: participants
            };
            activeGames.set(chatId, newGame);

            // رسالة الترحيب
            await sendMessage(sock, chatId, [
                `✅ @${sender.split('@')[0]} أنشأ الفعالية!`,
                `👥 عدد المشاركين: 1`,
                `📌 اكتب \`انضم\` للمشاركة`
            ], msg, [sender]);

            await sendMessage(sock, chatId, [
                `🏁 *فعالية أعلام الدول*`,
                ``,
                `🎤 فترة التسجيل: 30 ثانية`,
                `✍️ اكتب \`انضم\` للمشاركة`,
                `⚠️ يلزم وجود لاعبين على الأقل لبدء اللعبة`,
                `🏳️ سيتم وصف علم دولة، أول من يخمنها يفوز`,
                `🏆 كل إجابة صحيحة = نقطة`,
                `🥇 أول من يجمع 5 نقاط يفوز بـ 200 نقطة`,
                `⏰ المهلة 30 ثانية → خصم 10 نقاط من كل مشارك`,
                `🚪 للانسحاب أثناء اللعب: \`انسحب\``
            ], msg);

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
                                `✅ @${senderMsg.split('@')[0]} انضم إلى الفعالية!`,
                                `👥 العدد: ${game.players.length}`
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
                                    `🚪 @${senderMsg.split('@')[0]} انسحب من الفعالية.`,
                                    `👥 المتبقي: ${game.players.length}`
                                ], m, [senderMsg]);
                                if (game.players.length < 2) {
                                    await cancelGame(sock, chatId, 'أصبح عدد اللاعبين أقل من 2.');
                                    return;
                                }
                            } else {
                                await sendMessage(sock, chatId, [
                                    `⚠️ @${senderMsg.split('@')[0]}، أنت لست مشاركاً.`
                                ], m, [senderMsg]);
                            }
                            continue;
                        }

                        // الإجابة على وصف العلم
                        if (game.roundActive === true && !game.roundFinished && game.currentFlag) {
                            if (!game.players.includes(senderMsg)) continue;

                            const possibleAnswers = [
                                game.currentFlag.answer.toLowerCase(),
                                game.currentFlag.answer.replace(/ال/g, '').toLowerCase(),
                                game.currentFlag.answer.replace(/ة$/g, '').toLowerCase()
                            ];

                            if (possibleAnswers.some(a => a === content)) {
                                game.scores[senderMsg] = (game.scores[senderMsg] || 0) + 1;
                                const newScore = game.scores[senderMsg];
                                await sendMessage(sock, chatId, [
                                    `✅ @${senderMsg.split('@')[0]} إجابة صحيحة!`,
                                    `⭐ +1 نقطة`,
                                    `📊 رصيدك: ${newScore}/5`
                                ], m, [senderMsg]);

                                if (newScore >= 5) {
                                    const points = loadJSON(pointsPath);
                                    const finalReward = 200;
                                    points[senderMsg] = (points[senderMsg] || 0) + finalReward;
                                    saveJSON(pointsPath, points);
                                    await sendMessage(sock, chatId, [
                                        `🏆 *اللاعب @${senderMsg.split('@')[0]} حقق 5 نقاط وفاز!*`,
                                        `🎉 الجائزة: +${finalReward} نقطة`,
                                        `💰 رصيدك: ${points[senderMsg]} نقطة`
                                    ], m, [senderMsg]);
                                    await cancelGame(sock, chatId, 'انتهت الفعالية بفوز لاعب.');
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
                    await cancelGame(sock, chatId, 'لم ينضم عدد كافٍ من اللاعبين (يلزم لاعبين على الأقل).');
                    return;
                }
                game.status = 'playing';
                await startNewRound(sock, chatId);
            }, 30000);
            newGame.registrationTimeout = registrationTimeout;

            async function startNewRound(sock, chatId) {
                const game = activeGames.get(chatId);
                if (!game || game.status !== 'playing') return;

                const flag = flags[Math.floor(Math.random() * flags.length)];
                game.currentFlag = flag;
                game.roundActive = true;
                game.roundFinished = false;

                await sendMessage(sock, chatId, [
                    `🏁 *جولة جديدة*`,
                    ``,
                    `📝 ${flag.text}`,
                    `👥 المشاركون: ${game.players.length}`,
                    `⏳ الوقت: 30 ثانية`,
                    `✅ أول من يخمن الدولة الصحيحة يحصل على نقطة`,
                    ``,
                    `📝 اكتب اسم الدولة`,
                    `🚪 للانسحاب: \`انسحب\``
                ], null, game.players);

                const roundTimeout = setTimeout(async () => {
                    const currentGame = activeGames.get(chatId);
                    if (currentGame && currentGame.status === 'playing' && currentGame.roundActive === true && !currentGame.roundFinished) {
                        await cancelGame(sock, chatId, 'انتهت المهلة (30 ثانية) دون إجابة صحيحة.');
                    }
                }, 30000);

                if (game.roundTimeout) clearTimeout(game.roundTimeout);
                game.roundTimeout = roundTimeout;
            }

        } catch (error) {
            console.error('✗ خطأ في أمر اعلام:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};

// ========== دالة إلغاء الفعالية ==========
async function cancelGame(sock, chatId, reason) {
    const game = activeGames.get(chatId);
    if (!game) return;

    const points = loadJSON(pointsPath);
    let penaltyMsg = `❌ *تم إلغاء الفعالية!*\n📝 السبب: ${reason}\n\n`;

    if (game.players.length > 0) {
        for (const player of game.players) {
            points[player] = Math.max(0, (points[player] || 0) - 10);
        }
        saveJSON(pointsPath, points);
        penaltyMsg += `💔 تم خصم 10 نقاط من ${game.players.length} مشارك${game.players.length > 1 ? 'ين' : ''}`;
    }

    if (game.roundTimeout) clearTimeout(game.roundTimeout);
    if (game.registrationTimeout) clearTimeout(game.registrationTimeout);
    if (game.messageHandlerOff) game.messageHandlerOff();
    activeGames.delete(chatId);

    await sendMessage(sock, chatId, [penaltyMsg]);
}