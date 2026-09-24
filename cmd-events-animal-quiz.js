// حيوان.js - فعالية تخمين الحيوان (نسخة محسنة بدون خطوط)
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

const rewardMap = { سهل: 50, متوسط: 100, صعب: 200 };
const penaltyMap = { سهل: 50, متوسط: 100, صعب: 200 };
const timeMap = { سهل: 10000, متوسط: 15000, صعب: 20000 };

// ========== الحيوانات ==========
const animals = {
    سهل: [
        { question: 'حيوان أليف مواء', answers: ['قط', 'قطة'] },
        { question: 'حيوان أليف ينبح', answers: ['كلب'] },
        { question: 'حيوان معروف بسنامين', answers: ['جمل'] },
        { question: 'ملك الغابة', answers: ['أسد'] },
        { question: 'حيوان له خرطوم طويل', answers: ['فيل'] },
        { question: 'حيوان طويل العنق', answers: ['زرافة'] },
        { question: 'حيوان ينقز ويأكل الجزر', answers: ['أرنب'] },
        { question: 'حيوان يخزن الطعام في خدوده', answers: ['هامستر'] },
        { question: 'حيوان يعيش في الماء وله قشور', answers: ['سمكة'] },
        { question: 'حيوان صغير يعيش في المزرعة ويصيح', answers: ['دجاجة'] },
        { question: 'حيوان له قرون ويعيش في الجبال', answers: ['خروف'] },
        { question: 'حيوان له ذيل كثيف ويعيش في الغابة', answers: ['ثعلب'] }
    ],
    متوسط: [
        { question: 'أسرع حيوان بري في العالم', answers: ['فهد', 'شيتا'] },
        { question: 'حيوان معروف بحب الموز', answers: ['قرد', 'سعدان'] },
        { question: 'حيوان ثديي يطير', answers: ['خفاش', 'وطواط'] },
        { question: 'حيوان بحري ضخم يرش الماء', answers: ['حوت'] },
        { question: 'حيوان مفترس مخطط', answers: ['نمر'] },
        { question: 'حيوان يمشي ببطء شديد وله صدفة', answers: ['سلحفاة'] },
        { question: 'حيوان طائر لا يطير ويعيش في القطب', answers: ['بطريق'] },
        { question: 'حيوان معروف بحب الخيزران', answers: ['باندا'] },
        { question: 'حيوان له شعر كثيف ويعيش في الجبال الباردة', answers: ['دب'] },
        { question: 'حيوان يعيش في الصحاري وله سنام', answers: ['جمل'] }
    ],
    صعب: [
        { question: 'حيوان ثديي يضع بيضاً (من فصيلة الثدييات البياضة)', answers: ['خلد الماء', 'بلاتبس'] },
        { question: 'أكبر حيوان في العالم من حيث الحجم والوزن', answers: ['حوت أزرق'] },
        { question: 'حيوان له ثلاثة قلوب ودم أزرق', answers: ['أخطبوط'] },
        { question: 'حيوان يتغير لونه للتخفي', answers: ['حرباء'] },
        { question: 'حيوان يلد ويبيض في نفس الوقت (فصيلة نادرة)', answers: ['أيكيدنا', 'قنفذ النمل'] },
        { question: 'أسرع مخلوق بحري (سمكة)', answers: ['سمكة مارلين', 'مارلين'] },
        { question: 'حيوان له لسان أطول من جسمه', answers: ['زرافة'] },
        { question: 'حيوان يعيش في الصحراء ولا يشرب الماء لفترة طويلة', answers: ['جمل'] },
        { question: 'حيوان منقرض كان له أنياب كبيرة', answers: ['سيف ذو أسنان', 'سابرتوث'] },
        { question: 'أكبر طائر في العالم', answers: ['نعامة'] }
    ]
};

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🐾 فـعـالـيـة الـحـيـوان 🐾\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: ['حيوان'],
    description: '🐾 تخمين اسم الحيوان (سهل/متوسط/صعب)',
    category: 'فعاليات',
    usage: '.حيوان [سهل|متوسط|صعب]',
    example: '.حيوان سهل',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
            const points = loadJSON(pointsPath);

            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const parts = body.trim().split(/\s+/);
            const inputLevel = (parts[1] || '').trim();

            const validLevels = ['سهل', 'متوسط', 'صعب'];
            if (!validLevels.includes(inputLevel)) {
                const lines = [
                    '❌ *المستوى غير صحيح!*',
                    '',
                    '📖 *المستويات المتاحة:*',
                    '🟢 سهل - 50 نقطة',
                    '🟡 متوسط - 100 نقطة',
                    '🔴 صعب - 200 نقطة',
                    '',
                    '💡 مثال: .حيوان سهل'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            const levelQuestions = animals[inputLevel];
            const animal = levelQuestions[Math.floor(Math.random() * levelQuestions.length)];

            // إرسال السؤال
            const lines = [
                `🐾 *خمن الحيوان*`,
                ``,
                `❓ ${animal.question}`,
                ``,
                `⏳ الوقت: ${timeMap[inputLevel] / 1000} ثانية`,
                `💰 الجائزة: ${rewardMap[inputLevel]} نقطة`,
                `💔 الخسارة: -${penaltyMap[inputLevel]} نقطة`,
                `📊 المستوى: ${inputLevel}`,
                ``,
                `📝 اكتب اسم الحيوان`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

            let finished = false;

            const handler = async ({ messages }) => {
                if (finished) return;
                for (const m of messages) {
                    if (m.key.remoteJid !== chatId) continue;
                    const winner = m.key.participant || m.participant || m.key.remoteJid;
                    const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                    if (!txt) continue;

                    if (animal.answers.some(a => a.toLowerCase() === txt.trim().toLowerCase())) {
                        finished = true;
                        clearTimeout(timeout);
                        sock.ev.off('messages.upsert', handler);

                        points[winner] = (points[winner] || 0) + rewardMap[inputLevel];
                        saveJSON(pointsPath, points);

                        const resultLines = [
                            `🎉 *إجابة صحيحة!*`,
                            ``,
                            `🏆 الفائز: @${winner.split('@')[0]}`,
                            `🐾 الحيوان: *${animal.answers[0]}*`,
                            `⭐ +${rewardMap[inputLevel]} نقطة`,
                            `💰 نقاطك: ${points[winner]}`,
                            `🏅 رتبتك: ${getLevel(points[winner])}`,
                            ``,
                            `🥳 تهانينا!`
                        ];
                        await sendMessage(sock, chatId, resultLines, m, [winner]);
                        return;
                    }
                }
            };

            sock.ev.on('messages.upsert', handler);

            const timeout = setTimeout(async () => {
                if (finished) return;
                finished = true;
                sock.ev.off('messages.upsert', handler);

                // خصم من جميع المشاركين
                const metadata = await sock.groupMetadata(chatId);
                let deductedCount = 0;

                for (const participant of metadata.participants) {
                    const jid = participant.id;
                    if (jid !== sock.user.id) {
                        points[jid] = Math.max(0, (points[jid] || 0) - penaltyMap[inputLevel]);
                        deductedCount++;
                    }
                }

                saveJSON(pointsPath, points);

                const penaltyLines = [
                    `⏰ *انتهى الوقت!*`,
                    ``,
                    `🐾 الحيوان الصحيح: *${animal.answers[0]}*`,
                    ``,
                    `💔 تم خصم ${penaltyMap[inputLevel]} نقطة`,
                    ``,
                    `📌 حاول مرة أخرى مع .حيوان`
                ];
                await sendMessage(sock, chatId, penaltyLines, msg);
            }, timeMap[inputLevel]);

        } catch (error) {
            console.error('✗ خطأ في أمر حيوان:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};