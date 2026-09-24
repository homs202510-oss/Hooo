// عاصمة.js - فعالية تخمين عواصم الدول (نسخة محسنة بدون خطوط)
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
    if (points >= 500) return '⚡ ADVANCED';
    if (points >= 200) return '🌱 JUNIOR';
    return '🐣 NEWBIE';
}

const rewardMap = { سهل: 50, متوسط: 100, صعب: 200 };
const penaltyMap = { سهل: 50, متوسط: 100, صعب: 200 };
const timeMap = { سهل: 10000, متوسط: 15000, صعب: 20000 };

// ========== بنك العواصم ==========
const capitals = {
    سهل: [
        { question: 'ما عاصمة مصر؟', answers: ['القاهرة'] },
        { question: 'ما عاصمة السعودية؟', answers: ['الرياض'] },
        { question: 'ما عاصمة الإمارات؟', answers: ['أبوظبي'] },
        { question: 'ما عاصمة الكويت؟', answers: ['الكويت'] },
        { question: 'ما عاصمة قطر？', answers: ['الدوحة'] },
        { question: 'ما عاصمة البحرين؟', answers: ['المنامة'] },
        { question: 'ما عاصمة عمان؟', answers: ['مسقط'] },
        { question: 'ما عاصمة الأردن？', answers: ['عمان'] },
        { question: 'ما عاصمة لبنان؟', answers: ['بيروت'] },
        { question: 'ما عاصمة سوريا؟', answers: ['دمشق'] },
        { question: 'ما عاصمة العراق؟', answers: ['بغداد'] },
        { question: 'ما عاصمة فلسطين؟', answers: ['القدس', 'رام الله'] },
        { question: 'ما عاصمة اليمن？', answers: ['صنعاء'] },
        { question: 'ما عاصمة السودان؟', answers: ['الخرطوم'] },
        { question: 'ما عاصمة ليبيا？', answers: ['طرابلس'] },
        { question: 'ما عاصمة تونس？', answers: ['تونس'] },
        { question: 'ما عاصمة الجزائر？', answers: ['الجزائر'] },
        { question: 'ما عاصمة المغرب？', answers: ['الرباط'] }
    ],
    متوسط: [
        { question: 'ما عاصمة موريتانيا？', answers: ['نواكشوط'] },
        { question: 'ما عاصمة جيبوتي؟', answers: ['جيبوتي'] },
        { question: 'ما عاصمة الصومال？', answers: ['مقديشو'] },
        { question: 'ما عاصمة تركيا？', answers: ['أنقرة'] },
        { question: 'ما عاصمة إيران؟', answers: ['طهران'] },
        { question: 'ما عاصمة أفغانستان？', answers: ['كابول'] },
        { question: 'ما عاصمة باكستان？', answers: ['إسلام آباد'] },
        { question: 'ما عاصمة الهند？', answers: ['نيودلهي', 'دلهي'] },
        { question: 'ما عاصمة الصين？', answers: ['بكين'] },
        { question: 'ما عاصمة اليابان？', answers: ['طوكيو'] },
        { question: 'ما عاصمة كوريا الجنوبية？', answers: ['سيول'] },
        { question: 'ما عاصمة روسيا？', answers: ['موسكو'] },
        { question: 'ما عاصمة ألمانيا？', answers: ['برلين'] },
        { question: 'ما عاصمة فرنسا？', answers: ['باريس'] },
        { question: 'ما عاصمة إيطاليا？', answers: ['روما'] },
        { question: 'ما عاصمة إسبانيا？', answers: ['مدريد'] },
        { question: 'ما عاصمة بريطانيا？', answers: ['لندن'] },
        { question: 'ما عاصمة كندا？', answers: ['أوتاوا'] },
        { question: 'ما عاصمة أستراليا？', answers: ['كانبرا'] },
        { question: 'ما عاصمة البرازيل？', answers: ['برازيليا'] }
    ],
    صعب: [
        { question: 'ما عاصمة كازاخستان？', answers: ['نور سلطان', 'أستانا'] },
        { question: 'ما عاصمة أوزبكستان？', answers: ['طشقند'] },
        { question: 'ما عاصمة طاجيكستان？', answers: ['دوشنبه'] },
        { question: 'ما عاصمة قيرغيزستان？', answers: ['بيشكيك'] },
        { question: 'ما عاصمة تركمانستان？', answers: ['عشق آباد'] },
        { question: 'ما عاصمة أذربيجان؟', answers: ['باكو'] },
        { question: 'ما عاصمة أرمينيا？', answers: ['يريفان'] },
        { question: 'ما عاصمة جورجيا？', answers: ['تبليسي'] },
        { question: 'ما عاصمة منغوليا？', answers: ['أولان باتور'] },
        { question: 'ما عاصمة كمبوديا？', answers: ['بنوم بنه'] },
        { question: 'ما عاصمة ميانمار？', answers: ['نايبيداو'] },
        { question: 'ما عاصمة سريلانكا؟', answers: ['كولومبو'] },
        { question: 'ما عاصمة نيبال？', answers: ['كاثماندو'] },
        { question: 'ما عاصمة بنغلاديش？', answers: ['دكا'] },
        { question: 'ما عاصمة فيتنام？', answers: ['هانوي'] },
        { question: 'ما عاصمة الفلبين？', answers: ['مانيلا'] },
        { question: 'ما عاصمة إندونيسيا？', answers: ['جاكرتا'] },
        { question: 'ما عاصمة ماليزيا？', answers: ['كوالالمبور'] },
        { question: 'ما عاصمة سنغافورة？', answers: ['سنغافورة'] }
    ]
};

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🏛️ فـعـالـيـة الـعـواصـم 🏛️\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: ['عاصمة', 'عواصم'],
    description: '🏛️ تخمين عاصمة الدولة (سهل/متوسط/صعب)',
    category: 'فعاليات',
    usage: '.عاصمة [سهل|متوسط|صعب]',
    example: '.عاصمة سهل',

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
                    '💡 مثال: .عاصمة سهل'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            const levelQuestions = capitals[inputLevel];
            const capitalQuestion = levelQuestions[Math.floor(Math.random() * levelQuestions.length)];

            // إرسال السؤال
            const lines = [
                `🌍 *خمن العاصمة*`,
                ``,
                `❓ ${capitalQuestion.question}`,
                ``,
                `⏳ الوقت: ${timeMap[inputLevel] / 1000} ثانية`,
                `💰 الجائزة: ${rewardMap[inputLevel]} نقطة`,
                `💔 الخسارة: -${penaltyMap[inputLevel]} نقطة`,
                `🌎 المستوى: ${inputLevel}`,
                ``,
                `📝 اكتب اسم العاصمة`
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

                    if (capitalQuestion.answers.some(a => a.toLowerCase() === txt.trim().toLowerCase())) {
                        finished = true;
                        clearTimeout(timeout);
                        sock.ev.off('messages.upsert', handler);

                        points[winner] = (points[winner] || 0) + rewardMap[inputLevel];
                        saveJSON(pointsPath, points);

                        const resultLines = [
                            `🎉 *إجابة صحيحة!*`,
                            ``,
                            `🏆 الفائز: @${winner.split('@')[0]}`,
                            `🏛️ العاصمة: *${capitalQuestion.answers[0]}*`,
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

                // خصم نقاط من صاحب الأمر
                const penalty = penaltyMap[inputLevel];
                points[sender] = Math.max(0, (points[sender] || 0) - penalty);
                saveJSON(pointsPath, points);

                const penaltyLines = [
                    `⏰ *انتهى الوقت!*`,
                    ``,
                    `🏛️ العاصمة الصحيحة: *${capitalQuestion.answers[0]}*`,
                    ``,
                    `💔 تم خصم ${penalty} نقطة من @${sender.split('@')[0]}`,
                    `💰 نقاطك: ${points[sender]}`,
                    ``,
                    `📌 حاول مرة أخرى مع .عاصمة`
                ];
                await sendMessage(sock, chatId, penaltyLines, msg, [sender]);
            }, timeMap[inputLevel]);

        } catch (error) {
            console.error('✗ خطأ في أمر عاصمة:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};