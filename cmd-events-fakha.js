// فاكهة.js - فعالية تخمين الفاكهة (نسخة محسنة بدون خطوط)
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

// ========== قائمة الفواكه (بدون إيموجي في السؤال) ==========
const fruits = [
    { question: 'فاكهة حمراء صغيرة فيها بذور خارجية', answers: ['فراولة', 'الفراولة'] },
    { question: 'فاكهة صفراء طويلة يحبها القرود', answers: ['موز', 'الموز'] },
    { question: 'فاكهة خضراء من الداخل وبذور سوداء', answers: ['كيوي'] },
    { question: 'فاكهة حمضية برتقالية اللون', answers: ['برتقال', 'البرتقال'] },
    { question: 'فاكهة صيفية حمراء كبيرة', answers: ['بطيخ', 'البطيخ'] },
    { question: 'فاكهة بنفسجية صغيرة في عناقيد', answers: ['عنب', 'العنب'] },
    { question: 'فاكهة استوائية لها قشرة خشنة', answers: ['أناناس', 'الاناناس'] },
    { question: 'فاكهة خضراء أو حمراء مشهورة', answers: ['تفاح', 'التفاح'] },
    { question: 'فاكهة صفراء حامضة', answers: ['ليمون', 'الليمون'] },
    { question: 'فاكهة صيفية برتقالية من الداخل', answers: ['خوخ', 'الخوخ'] },
    { question: 'فاكهة استوائية برتقالية اللون', answers: ['مانجو', 'المانجا'] },
    { question: 'فاكهة صغيرة سوداء تستخدم بالعصائر', answers: ['توت', 'التوت'] },
    { question: 'فاكهة عربية مشهورة في رمضان', answers: ['تمر', 'التمر'] },
    { question: 'فاكهة خضراء قاسية تستخدم بالسلطات', answers: ['افوكادو', 'أفوكادو'] },
    { question: 'فاكهة صفراء صغيرة بيضاوية', answers: ['كمثرى', 'الكمثرى'] },
    { question: 'فاكهة تشبه البرتقال لكنها حمراء', answers: ['يوسفي', 'اليوسفي'] },
    { question: 'فاكهة استوائية لها قشرة بنية وشعر', answers: ['جوز الهند', 'جوزالهند'] },
    { question: 'فاكهة صغيرة حمراء تستخدم بالحلويات', answers: ['كرز', 'الكرز'] },
    { question: 'فاكهة خضراء كبيرة شوكية', answers: ['دوريان'] },
    { question: 'فاكهة وردية من الداخل وبذور سوداء', answers: ['فاكهة التنين', 'دراجون فروت'] },
    { question: 'فاكهة صفراء كبيرة معروفة برائحتها', answers: ['شمام', 'الشمام'] },
    { question: 'فاكهة تشبه البرتقال لكنها أصغر', answers: ['كلمنتينا'] },
    { question: 'فاكهة بنية صلبة تنمو على الأشجار', answers: ['جوز', 'الجوز'] },
    { question: 'فاكهة حمراء تستخدم كخضار', answers: ['طماطم', 'الطماطم'] },
    { question: 'فاكهة صغيرة زيتونية اللون', answers: ['زيتون', 'الزيتون'] }
];

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🍎 فـعـالـيـة الـفـواكـه 🍎\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: ['فاكهة', 'فواكه'],
    description: '🍎 فعالية تخمين الفاكهة من الوصف',
    category: 'فعاليات',
    usage: '.فاكهة',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
            const points = loadJSON(pointsPath);

            // اختيار فاكهة عشوائية
            const fruit = fruits[Math.floor(Math.random() * fruits.length)];
            const reward = 50;
            const penalty = 20;

            // إرسال السؤال
            const lines = [
                `🍓 *خمن الفاكهة من الوصف*`,
                ``,
                `📝 ${fruit.question}`,
                ``,
                `⏳ الوقت: 30 ثانية`,
                `💰 الجائزة: ${reward} نقطة`,
                `💔 الخسارة: -${penalty} نقطة`,
                ``,
                `📝 اكتب اسم الفاكهة`
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

                    if (fruit.answers.some(a => a.toLowerCase() === txt.trim().toLowerCase())) {
                        finished = true;
                        clearTimeout(timeout);
                        sock.ev.off('messages.upsert', handler);

                        points[winner] = (points[winner] || 0) + reward;
                        saveJSON(pointsPath, points);

                        const resultLines = [
                            `🎉 *إجابة صحيحة!*`,
                            ``,
                            `🏆 الفائز: @${winner.split('@')[0]}`,
                            `🍎 الفاكهة: *${fruit.answers[0]}*`,
                            `⭐ +${reward} نقطة`,
                            `💰 نقاطك: ${points[winner]}`,
                            `🏅 مستواك: ${getLevel(points[winner])}`,
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
                        points[jid] = Math.max(0, (points[jid] || 0) - penalty);
                        deductedCount++;
                    }
                }

                saveJSON(pointsPath, points);

                const penaltyLines = [
                    `⏰ *انتهى الوقت!*`,
                    ``,
                    `🍎 الفاكهة الصحيحة: *${fruit.answers[0]}*`,
                    ``,
                    `💔 تم خصم ${penalty} نقطة`,
                    ``,
                    `📌 حاول مرة أخرى مع .فاكهة`
                ];
                await sendMessage(sock, chatId, penaltyLines, msg);
            }, 30000);

        } catch (error) {
            console.error('✗ خطأ في أمر فاكهة:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};