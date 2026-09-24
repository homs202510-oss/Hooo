// ايموجي.js - فعالية تخمين الشخصية من 4 إيموجيات (الجائزة 600 نقطة)

const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const gameStatePath = path.join(__dirname, 'db-emojiGame.json');

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

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎭 لـعـبـة الإيـمـوجـي 🎭\n`;
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

// ===================== قاعدة بيانات الشخصيات (اسم + 4 إيموجيات) =====================
const characters = [
    { name: 'لوفي', emojis: ['🏴‍☠️', '👒', '🍖', '🦁'] },
    { name: 'ناروتو', emojis: ['🍥', '🦊', '🌀', '🔶'] },
    { name: 'ساسكي', emojis: ['⚔️', '🐉', '👁️', '💜'] },
    { name: 'غوكو', emojis: ['🐉', '💪', '⚡', '🍜'] },
    { name: 'تانجيرو', emojis: ['🗡️', '🌊', '👺', '🧧'] },
    { name: 'غوجو', emojis: ['👁️', '🌀', '🔮', '💙'] },
    { name: 'سايتاما', emojis: ['👊', '💥', '🦲', '🥚'] },
    { name: 'ميكاسا', emojis: ['🧣', '⚔️', '🪶', '👩'] },
    { name: 'إرين', emojis: ['🌋', '🏚️', '💚', '🐉'] },
    { name: 'هيسوكا', emojis: ['🃏', '🎲', '💜', '🔪'] },
    { name: 'كيلوا', emojis: ['⚡', '🐱', '🔌', '🤍'] },
    { name: 'ليفاي', emojis: ['🗡️', '🧹', '🖤', '⚙️'] },
    { name: 'إيتشيغو', emojis: ['⚔️', '🖤', '🌀', '👺'] },
    { name: 'إدوارد', emojis: ['⚙️', '🦾', '🔴', '📖'] },
    { name: 'زورو', emojis: ['⚔️', '🍺', '💚', '🗡️'] },
    { name: 'نامي', emojis: ['🍊', '💰', '🌊', '📿'] },
    { name: 'سانجي', emojis: ['🍳', '👞', '💛', '🚬'] },
    { name: 'تشوبر', emojis: ['🦌', '💊', '🌸', '🎒'] },
    { name: 'كاكاشي', emojis: ['📖', '⚡', '🐶', '🖤'] },
    { name: 'هيناتا', emojis: ['💜', '👁️', '🌸', '🥋'] },
    { name: 'بيكولو', emojis: ['👳', '💚', '🌀', '👊'] },
    { name: 'فيجيتا', emojis: ['👑', '💙', '⚡', '💪'] },
    { name: 'فريزا', emojis: ['👽', '💜', '⚪', '👑'] },
    { name: 'برولي', emojis: ['💚', '💪', '👊', '🐉'] },
    { name: 'لي', emojis: ['🍥', '💚', '👊', '🏃'] }
];

function normalize(str) {
    return str.trim().replace(/[أإآ]/g, 'ا').replace(/[ى]/g, 'ي').replace(/\s+/g, ' ').toLowerCase();
}

function isMatching(input, target) {
    return normalize(input) === normalize(target);
}

const activeGames = new Map();

async function cancelGame(sock, chatId, reason, penalty = false, silent = false) {
    const game = activeGames.get(chatId);
    if (!game) return;
    if (penalty && game.playersList && game.playersList.length) {
        const points = loadJSON(pointsPath);
        let penaltyLines = [
            '❌ *تم إلغاء الفعالية!*',
            `📝 السبب: ${reason}`,
            ''
        ];
        for (const player of game.playersList) {
            points[player] = (points[player] || 0) - 10;
            penaltyLines.push(`📉 @${player.split('@')[0]} : ${points[player]} نقطة (خصم 10)`);
        }
        saveJSON(pointsPath, points);
        await sendMessage(sock, chatId, penaltyLines, null, game.playersList);
    } else if (!silent) {
        await sendMessage(sock, chatId, [
            '❌ *تم إلغاء الفعالية!*',
            `📝 السبب: ${reason}`
        ]);
    }
    if (game.registrationTimeout) clearTimeout(game.registrationTimeout);
    if (game.roundTimeout) clearTimeout(game.roundTimeout);
    if (game.listener) sock.ev.off('messages.upsert', game.listener);
    activeGames.delete(chatId);
    const gs = loadJSON(gameStatePath);
    delete gs[chatId];
    saveJSON(gameStatePath, gs);
}

module.exports = {
    command: 'ايموجي',
    description: '🎭 تخمين الشخصية من 4 إيموجيات – الجائزة 600 نقطة',
    category: 'العاب',
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const hostName = sender.split('@')[0];

        if (activeGames.has(chatId)) {
            await sendMessage(sock, chatId, [
                '⚠️ *يوجد فعالية نشطة*',
                '',
                '📌 انتظر حتى تنتهي اللعبة الحالية'
            ], msg);
            return;
        }

        // اختيار شخصية عشوائية
        const secret = characters[Math.floor(Math.random() * characters.length)];

        const game = {
            status: 'registering',
            playersMap: {},
            playersList: [sender],
            secretCharacter: secret,
            roundActive: false,
            registrationTimeout: null,
            roundTimeout: null,
            listener: null
        };
        game.playersMap[sender] = { alive: true };
        activeGames.set(chatId, game);

        // ===== رسالة بدء التسجيل =====
        const startLines = [
            '🔮 *فعالية الإيموجي* 🔮',
            '',
            '📝 سيظهر البوت 4 إيموجيات تمثل شخصية أنمي.',
            'أول من يكتب اسم الشخصية الصحيحة يفوز بـ *600 نقطة*.',
            '',
            `🎭 *المقدم:* @${hostName}`,
            `🎁 *الجائزة:* 600 نقطة`,
            `📊 *المشاركون:* 1`,
            '',
            '⏳ *فترة التسجيل:* 30 ثانية',
            '✍️ اكتب `انضم` للمشاركة'
        ];
        await sendMessage(sock, chatId, startLines, msg, [sender]);

        // ===== مستمع التسجيل =====
        const joinHandler = async ({ messages }) => {
            const cur = activeGames.get(chatId);
            if (!cur || cur.status !== 'registering') return;
            for (const m of messages) {
                const senderMsg = m.key.participant || m.participant || m.key.remoteJid;
                if (senderMsg === sock.user.id) continue;
                if (m.key.remoteJid !== chatId) continue;
                const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                if (txt.trim().toLowerCase() === 'انضم') {
                    if (cur.playersMap[senderMsg]) {
                        await sendMessage(sock, chatId, [
                            `⚠️ @${senderMsg.split('@')[0]} أنت مشترك بالفعل.`
                        ], m, [senderMsg]);
                        continue;
                    }
                    cur.playersMap[senderMsg] = { alive: true };
                    cur.playersList.push(senderMsg);
                    await sendMessage(sock, chatId, [
                        `✅ @${senderMsg.split('@')[0]} انضم! (${cur.playersList.length})`
                    ], m, [senderMsg]);
                }
            }
        };
        sock.ev.on('messages.upsert', joinHandler);

        // ===== إنهاء التسجيل بعد 30 ثانية وبدء الجولة =====
        game.registrationTimeout = setTimeout(async () => {
            sock.ev.off('messages.upsert', joinHandler);
            const cur = activeGames.get(chatId);
            if (!cur || cur.status !== 'registering') return;
            if (cur.playersList.length < 2) {
                await cancelGame(sock, chatId, 'لم ينضم عدد كافٍ من اللاعبين (يلزم 2 على الأقل).');
                return;
            }
            cur.status = 'playing';
            cur.roundActive = true;

            // ===== عرض الإيموجيات =====
            const emojiString = cur.secretCharacter.emojis.join(' ');
            const challengeLines = [
                '🎭 *تحدي الإيموجي* 🎭',
                '',
                `📸 الإيموجيات: ${emojiString}`,
                `⏳ الوقت: 60 ثانية`,
                `🏆 الجائزة: 600 نقطة`,
                '',
                '✨ أول من يكتب اسم الشخصية الصحيحة يفوز! ✨'
            ];
            await sendMessage(sock, chatId, challengeLines);

            // ===== مستمع التخمينات =====
            const guessHandler = async ({ messages }) => {
                const current = activeGames.get(chatId);
                if (!current || current.status !== 'playing' || !current.roundActive) return;
                for (const m of messages) {
                    const responder = m.key.participant || m.participant || m.key.remoteJid;
                    if (responder === sock.user.id) continue;
                    if (m.key.remoteJid !== chatId) continue;
                    if (!current.playersMap[responder]) continue;
                    const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                    if (!txt.trim()) continue;
                    if (isMatching(txt, current.secretCharacter.name)) {
                        current.roundActive = false;
                        clearTimeout(current.roundTimeout);
                        sock.ev.off('messages.upsert', guessHandler);
                        const points = loadJSON(pointsPath);
                        const reward = 600;
                        points[responder] = (points[responder] || 0) + reward;
                        saveJSON(pointsPath, points);
                        await sendMessage(sock, chatId, [
                            '🎉 *إجابة صحيحة!* 🎉',
                            '',
                            `🏆 *الفائز:* @${responder.split('@')[0]}`,
                            `🎭 *الشخصية:* ${current.secretCharacter.name}`,
                            `📸 *الإيموجيات:* ${current.secretCharacter.emojis.join(' ')}`,
                            `💰 *المكافأة:* +${reward} نقطة`,
                            `📊 *رصيدك:* ${points[responder]} نقطة`,
                            `🏅 *رتبتك:* ${getLevel(points[responder])}`
                        ], null, [responder]);
                        await cancelGame(sock, chatId, 'انتهت الفعالية بفوز لاعب.', false, true);
                        return;
                    }
                }
            };
            sock.ev.on('messages.upsert', guessHandler);
            current.listener = guessHandler;

            // ===== مهلة 60 ثانية للإجابة =====
            current.roundTimeout = setTimeout(async () => {
                const final = activeGames.get(chatId);
                if (final && final.status === 'playing' && final.roundActive) {
                    await cancelGame(sock, chatId, 'انتهى الوقت دون إجابة صحيحة.', true);
                }
            }, 60000);
        }, 30000);
    }
};