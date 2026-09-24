// انمي.js - لعبة تخمين الأنمي من الإيموجي (نسخة محسنة بتنسيق موحد)

const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const ranksPath = path.join(__dirname, 'db-ranks.json');

if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, '{}');
if (!fs.existsSync(ranksPath)) fs.writeFileSync(ranksPath, '{}');

function loadJSON(file, fallback = {}) {
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
    if (points >= 1000000) return '🔥 WTF';
    if (points >= 100000) return '🔪 KILLER';
    if (points >= 10000) return '🦁 LEGEND';
    if (points >= 1000) return '💎 PRO';
    if (points >= 500) return '🔥 ADVANCED';
    if (points >= 200) return '🌱 JUNIOR';
    return '🙂 BEGINNER';
}

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

// ========== دالة الإرسال الموحدة ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎭 تـخـمـيـن الأنـمـي 🎭\n`;
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

// ========== قاعدة بيانات الأنمي بالإيموجيات ==========
const animeEmojis = [
    { emojis: '🧩 🕳️👧🤖🩸', answer: 'إيفانجيليون', hint: 'ميكا مع فتيات ودماء' },
    { emojis: '🏴‍☠️👒🍖🦁', answer: 'ون بيس', hint: 'قراصنة وقبعة قش' },
    { emojis: '🍥🦊🌀🔶', answer: 'ناروتو', hint: 'قرية مخفية وثعلب' },
    { emojis: '⚔️🐉👁️💜', answer: 'ناروتو', hint: 'شارينغان وعشيرة أوتشيها' },
    { emojis: '🐉💪⚡🍜', answer: 'دراغون بول', hint: 'سايان وكرات التنين' },
    { emojis: '🗡️🌊👺🧧', answer: 'قاتل الشياطين', hint: 'تنفس الماء وشياطين' },
    { emojis: '👁️🌀🔮💙', answer: 'جوجوتسو كايسن', hint: 'طاقة ملعونة وعصابة عيون' },
    { emojis: '👊💥🦲🥚', answer: 'ون بنش مان', hint: 'أصلع ولكمة واحدة' },
    { emojis: '🧣⚔️🪶👩', answer: 'هجوم العمالقة', hint: 'وشاح وعمالقة' },
    { emojis: '🃏🎲💜🔪', answer: 'هنتر x هنتر', hint: 'بطاقات وهيسوكا' },
    { emojis: '⚡🐱🔌🤍', answer: 'هنتر x هنتر', hint: 'كهرباء وكيلوا' },
    { emojis: '🗡️🧹🖤⚙️', answer: 'هجوم العمالقة', hint: 'عتاد وليفاي' },
    { emojis: '⚔️🖤🌀👺', answer: 'بليتش', hint: 'سول رايبر وروح' },
    { emojis: '⚙️🦾🔴📖', answer: 'فول ميتال ألكيميست', hint: 'ذراع آلية وكيمياء' },
    { emojis: '🍊💰🌊📿', answer: 'ون بيس', hint: 'نامي وبرتقال' },
    { emojis: '🍳👞💛🚬', answer: 'ون بيس', hint: 'طباخ وحذاء' },
    { emojis: '🦌💊🌸🎒', answer: 'ون بيس', hint: 'طبيب ورنمة' },
    { emojis: '📖⚡🐶🖤', answer: 'ناروتو', hint: 'كتاب وكلاب' },
    { emojis: '💜👁️🌸🥋', answer: 'ناروتو', hint: 'عيون بيضاء' },
    { emojis: '🍥💚👊🏃', answer: 'ناروتو', hint: 'حاجبين كثيفين' },
    { emojis: '👳💚🌀👊', answer: 'دراغون بول', hint: 'اسمي وقرون' },
    { emojis: '👑💙⚡💪', answer: 'دراغون بول', hint: 'أمير سايان' },
    { emojis: '👽💜⚪👑', answer: 'دراغون بول', hint: 'إمبراطور الفضاء' },
    { emojis: '💚💪👊🐉', answer: 'دراغون بول', hint: 'سايان أسطوري' },
    { emojis: '☠️🏴‍☠️💰⚓', answer: 'ون بيس', hint: 'قراصنة وكنز' },
    { emojis: '🕷️🕸️🖤👁️', answer: 'هنتر x هنتر', hint: 'عناكب وكرولو' },
    { emojis: '🌋🏚️💚🐉', answer: 'هجوم العمالقة', hint: 'عملاق ومدمر' },
    { emojis: '🔮👁️🖤🌀', answer: 'جوجوتسو كايسن', hint: 'عيون وجوتسو' },
    { emojis: '🦋🌸🌸🗡️', answer: 'قاتل الشياطين', hint: 'تنفس الحشرات' },
    { emojis: '🐺🌙🩸🗡️', answer: 'قاتل الشياطين', hint: 'تنفس القمر' },
    { emojis: '🧙‍♂️👓📚⚡', answer: 'هاري بوتر', hint: 'ساحر ونظارات' },
    { emojis: '🦸‍♂️🕷️🌆🕸️', answer: 'الرجل العنكبوت', hint: 'خارق ونيويورك' },
    { emojis: '🦇🌃🖤💀', answer: 'باتمان', hint: 'خفاش وغوثام' }
];

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['ايموجيات'],
    description: '🎭 تخمين اسم الأنمي من الإيموجي',
    category: 'العاب',
    usage: '.ايموجيات (يظهر سؤال) | .ايموجيات تلميح (يعطي تلميح)',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const points = loadJSON(pointsPath);
            const ranks = loadJSON(ranksPath);
            const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/);
            const subCommand = args[1]?.toLowerCase();

            // اختيار أنمي عشوائي
            const selected = animeEmojis[Math.floor(Math.random() * animeEmojis.length)];
            let ended = false;
            let timer = null;

            // ===== إذا كان طلب تلميح =====
            if (subCommand === 'تلميح' || subCommand === 'hint') {
                await sendMessage(sock, chatId, [
                    '💡 *تلميح*',
                    '',
                    `🧩 الإيموجيات: ${selected.emojis}`,
                    `💡 التلميح: ${selected.hint}`,
                    '',
                    '📝 اكتب اسم الأنمي الآن!'
                ], msg);
                return;
            }

            // ===== إرسال السؤال =====
            await sendMessage(sock, chatId, [
                '🎭 *خمن الأنمي من الإيموجيات*',
                '',
                `🧩 الإيموجيات:`,
                `${selected.emojis}`,
                '',
                '✍️ أرسل اسم الأنمي فوراً!',
                '💡 اكتب `.ايموجيات تلميح` للحصول على مساعدة.',
                '',
                `⏳ لديك 30 ثانية`,
                `💰 المكافأة: 50 نقطة`,
                `⚠️ العقاب: -20 نقطة`
            ], msg);

            // ===== معالج الإجابات =====
            const handler = async ({ messages }) => {
                if (ended) return;
                for (const m of messages) {
                    if (m.key.remoteJid !== chatId) continue;
                    if (m.key.fromMe) continue;

                    const responder = m.key.participant || m.participant || m.key.remoteJid;
                    const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                    if (!txt) continue;

                    const trimmed = txt.trim().toLowerCase();

                    // ===== طلب تلميح أثناء اللعب =====
                    if (trimmed === 'تلميح' || trimmed === 'hint') {
                        await sendMessage(sock, chatId, [
                            '💡 *تلميح*',
                            '',
                            `🧩 الإيموجيات: ${selected.emojis}`,
                            `💡 التلميح: ${selected.hint}`,
                            '',
                            '📝 اكتب اسم الأنمي الآن!'
                        ], m);
                        continue;
                    }

                    // ===== التحقق من الإجابة =====
                    if (trimmed === selected.answer.toLowerCase()) {
                        ended = true;
                        clearTimeout(timer);
                        sock.ev.off('messages.upsert', handler);

                        const reward = 50;
                        ranks[responder] = (ranks[responder] || 0) + 1;
                        points[responder] = (points[responder] || 0) + reward;
                        saveJSON(ranksPath, ranks);
                        saveJSON(pointsPath, points);

                        await sendMessage(sock, chatId, [
                            '🎉 *إجابة صحيحة!* 🎉',
                            '',
                            `🏆 *الفائز:* @${responder.split('@')[0]}`,
                            `🎭 *الأنمي:* ${selected.answer}`,
                            `🧩 *الإيموجيات:* ${selected.emojis}`,
                            `💰 *المكافأة:* +${reward} نقطة`,
                            `📊 *رصيدك:* ${formatNumber(points[responder] || 0)} نقطة`,
                            `🏅 *رتبتك:* ${getLevel(points[responder] || 0)}`
                        ], m, [responder]);
                        return;
                    }
                }
            };

            sock.ev.on('messages.upsert', handler);

            // ===== مهلة 30 ثانية =====
            timer = setTimeout(async () => {
                if (ended) return;
                ended = true;
                sock.ev.off('messages.upsert', handler);

                const penalty = 20;
                points[sender] = (points[sender] || 0) - penalty;
                saveJSON(pointsPath, points);

                await sendMessage(sock, chatId, [
                    '⏰ *انتهى الوقت!*',
                    '',
                    `❌ *الإجابة:* ${selected.answer}`,
                    `🧩 *الإيموجيات:* ${selected.emojis}`,
                    `➖ *تم خصم:* ${penalty} نقطة من @${sender.split('@')[0]}`,
                    `📊 *رصيدك:* ${formatNumber(points[sender] || 0)} نقطة`
                ], null, [sender]);

            }, 30000);

        } catch (error) {
            console.error('❌ خطأ في أمر ايموجيات:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};