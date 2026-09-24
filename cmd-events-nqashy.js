// نقاشي.js - فعالية أسئلة نقاشية متعددة المجالات (الجائزة 50 نقطة) - نسخة بدون خطوط
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const questionsPath = path.join(__dirname, 'db-discussion.json');

if (!fs.existsSync(__dirname)) fs.mkdirSync(__dirname, { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(questionsPath)) fs.writeFileSync(questionsPath, JSON.stringify([], null, 2));

function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

function getLevel(points) {
    if (points >= 1000000) return '🏆 أسطوري';
    if (points >= 500000) return '🔥 خارق';
    if (points >= 100000) return '💎 محترف';
    if (points >= 50000) return '🌟 متميز';
    if (points >= 10000) return '🌱 مبتدئ';
    return '🍃 جديد';
}

// ===================== قاعدة البيانات =====================
const defaultQuestions = [
    // أنمي
    { category: '🎌 أنمي', question: 'ما اسم ملك النمل في هنتر؟', answer: 'ميرويم', reward: 50 },
    { category: '🎌 أنمي', question: 'من هو والد ناروتو؟', answer: 'ميناتو', reward: 50 },
    { category: '🎌 أنمي', question: 'كم عدد أفراد طاقم قبعة القش (بدون لوفي)؟', answer: '9', reward: 50 },
    { category: '🎌 أنمي', question: 'ما اسم بنكاي إيتشيغو؟', answer: 'تنغيتسو', reward: 50 },
    { category: '🎌 أنمي', question: 'من هو أقوى جوجوتسو في العصر الحديث؟', answer: 'غوجو', reward: 50 },
    { category: '🎌 أنمي', question: 'ما اسم التنفس الذي يستخدمه تانجيرو؟', answer: 'تنفس الماء', reward: 50 },
    { category: '🎌 أنمي', question: 'ما اسم العملاق الذي يتحكم به إرين؟', answer: 'عملاق الهجوم', reward: 50 },
    { category: '🎌 أنمي', question: 'كم عدد كرات التنين؟', answer: '7', reward: 50 },
    { category: '🎌 أنمي', question: 'ما اسم والد غون؟', answer: 'جين', reward: 50 },
    { category: '🎌 أنمي', question: 'ما اسم شينيغامي الذي يملك دفتر الموت؟', answer: 'ريوك', reward: 50 },
    { category: '🎌 أنمي', question: 'من هو قائد قراصنة قبعة القش؟', answer: 'لوفي', reward: 50 },
    { category: '🎌 أنمي', question: 'ما اسم سيف زورو الثلاثي؟', answer: 'وادو إيتشيمونجي', reward: 50 },
    { category: '🎌 أنمي', question: 'من هو معلم ناروتو؟', answer: 'كاكاشي', reward: 50 },
    { category: '🎌 أنمي', question: 'ما اسم قرية ناروتو؟', answer: 'قرية الورق المخفية', reward: 50 },
    { category: '🎌 أنمي', question: 'من هو بطل ون بنش مان؟', answer: 'سايتاما', reward: 50 },
    // ألعاب فيديو
    { category: '🎮 ألعاب', question: 'ما اسم بطل لعبة The Legend of Zelda؟', answer: 'لينك', reward: 50 },
    { category: '🎮 ألعاب', question: 'في أي لعبة نجد شخصية "ماستر شيف"؟', answer: 'هيلو', reward: 50 },
    { category: '🎮 ألعاب', question: 'ما اسم لعبة البناء الأشهر؟', answer: 'ماين كرافت', reward: 50 },
    { category: '🎮 ألعاب', question: 'من هو بطل سلسلة God of War؟', answer: 'كراتوس', reward: 50 },
    { category: '🎮 ألعاب', question: 'ما اسم لعبة البلاتفورم الشهيرة من نينتندو؟', answer: 'سوبر ماريو', reward: 50 },
    // مشاهير
    { category: '⭐ مشاهير', question: 'من هو مؤسس شركة آبل؟', answer: 'ستيف جوبز', reward: 50 },
    { category: '⭐ مشاهير', question: 'من هو صاحب نظرية النسبية؟', answer: 'أينشتاين', reward: 50 },
    { category: '⭐ مشاهير', question: 'من هو مخترع المصباح الكهربائي؟', answer: 'توماس إديسون', reward: 50 },
    { category: '⭐ مشاهير', question: 'من هو مؤلف رواية "الأمير الصغير"؟', answer: 'أنطوان دو سانت إكزوبيري', reward: 50 },
    { category: '⭐ مشاهير', question: 'من هو لاعب كرة القدم الملقب بـ "الأسطورة"؟', answer: 'بيليه', reward: 50 },
    // جغرافيا وتاريخ
    { category: '🌍 جغرافيا', question: 'ما هي عاصمة فرنسا؟', answer: 'باريس', reward: 50 },
    { category: '🌍 جغرافيا', question: 'ما هي أطول سلسلة جبال في العالم؟', answer: 'جبال الأنديز', reward: 50 },
    { category: '🌍 جغرافيا', question: 'ما هو أكبر محيط في العالم؟', answer: 'المحيط الهادئ', reward: 50 },
    { category: '📜 تاريخ', question: 'في أي عام انتهت الحرب العالمية الثانية؟', answer: '1945', reward: 50 },
    { category: '📜 تاريخ', question: 'من هو قائد معركة اليرموك؟', answer: 'خالد بن الوليد', reward: 50 },
    // علوم وتكنولوجيا
    { category: '🔬 علوم', question: 'ما هو العنصر الكيميائي رمزه O؟', answer: 'أكسجين', reward: 50 },
    { category: '🔬 علوم', question: 'ما هو أقرب كوكب إلى الشمس؟', answer: 'عطارد', reward: 50 },
    { category: '💻 تكنولوجيا', question: 'ما هو نظام التشغيل من إنتاج جوجل؟', answer: 'أندرويد', reward: 50 },
    { category: '💻 تكنولوجيا', question: 'من هو مؤسس فيسبوك؟', answer: 'مارك زوكربيرغ', reward: 50 }
];

let questionsDB = loadJSON(questionsPath);
if (questionsDB.length === 0) {
    questionsDB = defaultQuestions;
    saveJSON(questionsPath, questionsDB);
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `❓ فـعـالـيـة نـقـاشـي ❓\n`;
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
    command: 'نقاشي',
    description: '❓ سؤال نقاشي في مجالات متنوعة – أول من يجيب يفوز بـ 50 نقطة',
    category: 'فعاليات',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const points = loadJSON(pointsPath);

            if (activeGames.has(chatId)) {
                await sendMessage(sock, chatId, [
                    '⚠️ هناك سؤال نشط بالفعل، انتظر حتى ينتهي.'
                ], msg);
                return;
            }

            const q = questionsDB[Math.floor(Math.random() * questionsDB.length)];
            const reward = q.reward;
            let finished = false;

            // ===== إرسال السؤال =====
            const lines = [
                `📚 ${q.category}`,
                ``,
                `❓ ${q.question}`,
                ``,
                `⏳ الوقت: 60 ثانية`,
                `🏆 الجائزة: ${reward} نقطة`,
                ``,
                `✨ أول من يجيب إجابة صحيحة يفوز!`
            ];

            await sendMessage(sock, chatId, lines, msg);
            activeGames.set(chatId, { timeout: null, listener: null });

            const listener = async ({ messages }) => {
                if (finished) return;
                for (const m of messages) {
                    if (m.key.remoteJid !== chatId) continue;
                    const responder = m.key.participant || m.participant || m.key.remoteJid;
                    const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                    if (!txt.trim()) continue;

                    const answerNorm = txt.trim().toLowerCase();
                    const correctNorm = q.answer.toLowerCase();
                    
                    if (answerNorm === correctNorm) {
                        finished = true;
                        clearTimeout(timeout);
                        sock.ev.off('messages.upsert', listener);

                        points[responder] = (points[responder] || 0) + reward;
                        saveJSON(pointsPath, points);

                        const winLines = [
                            `✅ إجابة صحيحة!`,
                            ``,
                            `👑 الفائز: @${responder.split('@')[0]}`,
                            `📖 الإجابة: ${txt.trim()}`,
                            `💰 +${reward} نقطة`,
                            `📊 رصيدك: ${points[responder]} نقطة`,
                            `🎖️ رتبتك: ${getLevel(points[responder])}`
                        ];

                        await sendMessage(sock, chatId, winLines, msg, [responder]);
                        activeGames.delete(chatId);
                        return;
                    }
                }
            };

            sock.ev.on('messages.upsert', listener);
            activeGames.get(chatId).listener = listener;

            const timeout = setTimeout(async () => {
                if (finished) return;
                finished = true;
                sock.ev.off('messages.upsert', listener);
                activeGames.delete(chatId);

                const timeoutLines = [
                    `⏰ انتهى الوقت!`,
                    ``,
                    `📖 الإجابة الصحيحة: ${q.answer}`,
                    ``,
                    `📌 حاول مرة أخرى مع .نقاشي`
                ];
                await sendMessage(sock, chatId, timeoutLines, msg);
            }, 60000);

            activeGames.get(chatId).timeout = timeout;

        } catch (error) {
            console.error('✗ خطأ في أمر نقاشي:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};