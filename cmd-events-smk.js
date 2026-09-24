// سمك.js - فعالية تخمين الكائنات البحرية (نسخة مستقلة بدون مملكة)
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

// ========== الكائنات البحرية ==========
const seaCreatures = {
    سهل: [
        { question: 'سمك مفترس معروف بأسنانه الحادة', answers: ['قرش', 'سمك قرش'] },
        { question: 'كائن بحري ذكي ولطيف، يسمى "دلفين"', answers: ['دلفين'] },
        { question: 'حيوان بحري له ثمانية أذرع', answers: ['أخطبوط'] },
        { question: 'كائن بحري صغير لونه ذهبي، يربى في الأحواض', answers: ['سمك ذهبي'] },
        { question: 'قشريات بحرية حمراء تطبخ عادة', answers: ['جمبري', 'روبيان'] },
        { question: 'حيوان بحري له ذيل لاسع', answers: ['عقرب البحر', 'سمك الراي اللاسع'] },
        { question: 'كائن بحري عظمي مسطح يعيش في القاع', answers: ['سمك مفلطح', 'مفلطح'] },
        { question: 'رخوي بحري له صدفة حلزونية', answers: ['حلزون بحري', 'حلزون'] },
        { question: 'سمكة صغيرة ملونة تعيش بين شعب المرجان', answers: ['سمكة المهرج', 'نيمو'] },
        { question: 'كائن بحري شفاف له أجراس لاسعة', answers: ['قنديل البحر', 'قنديل'] },
        { question: 'سمكة ذات لون فضي وتعيش في المياه المالحة', answers: ['سمك السلمون', 'سلمون'] },
        { question: 'كائن بحري له صدفة صلبة ويعيش على الصخور', answers: ['بلح البحر', 'بلح'] }
    ],
    متوسط: [
        { question: 'أضخم كائن حي على وجه الأرض', answers: ['حوت أزرق', 'الحوت الأزرق'] },
        { question: 'سمكة ذات خطم طويل مثل الإبرة', answers: ['سمك إبرة', 'إبرة البحر'] },
        { question: 'حيوان بحري له قرون استشعار طويلة ويعيش في الصدف', answers: ['سرطان البحر', 'سرطان'] },
        { question: 'سمكة تطير فوق سطح الماء', answers: ['سمك طائر'] },
        { question: 'كائن بحري يشبه الحصان', answers: ['فرس البحر', 'حصان البحر'] },
        { question: 'سمكة شديدة السمية تعيش في المرجان', answers: ['سمكة الأسد'] },
        { question: 'سمكة مفترسة تعيش في المياه المالحة والعذبة', answers: ['سمك البيرانا', 'بيرانا'] },
        { question: 'كائن بحري له صدفة كبيرة ويمكن أن يكون لؤلؤياً', answers: ['محار', 'صدفة'] },
        { question: 'سمكة لها جسم أنبوبي طويل وفم صغير', answers: ['سمك الأنبوب'] },
        { question: 'كائن بحري يعيش في المياه الباردة وله زعانف كبيرة', answers: ['سمك التونة', 'تونة'] },
        { question: 'سمكة لها رأس كبير وفم عريض تعيش في الأعماق', answers: ['سمكة أبو الشص'] },
        { question: 'كائن بحري له قوقعة حلزونية كبيرة', answers: ['حلزون البحر العملاق'] }
    ],
    صعب: [
        { question: 'أسرع سمكة في العالم', answers: ['سمكة الزعنفة الشراعية', 'الزعنفة الشراعية', 'سمكة مارلين'] },
        { question: 'حيوان بحري غامض له أذرع طويلة جداً ويعيش في الأعماق', answers: ['حبار عملاق', 'حبار ضخم'] },
        { question: 'سمكة قاتلة شديدة السمية تحتوي على سم تكفي لقتل 10 أشخاص', answers: ['سمكة المنتفخة', 'المنتفخة', 'فوجو'] },
        { question: 'رخوي صغير جداً سام يعيش في المحيط الهادئ، حلقاته زرقاء', answers: ['أخطبوط الحلقات الزرقاء'] },
        { question: 'سمكة مسطحة كالشمس تعيش في المياه العميقة', answers: ['سمكة الشمس', 'مولا مولا'] },
        { question: 'قشريات بحرية عمياء تعيش في الفتحات الحرارية المائية', answers: ['سرطان يتي', 'كيوا'] },
        { question: 'سمكة لها خاصية توليد تيار كهربائي', answers: ['سمك الرعاد الكهربائي', 'رعاد', 'ثعبان الكهرباء'] },
        { question: 'سمك مرجاني صغير جداً له ألوان زاهية يشبه الفراشة', answers: ['سمكة الفراشة'] },
        { question: 'كائن بحري له جسم يشبه الأنبوب ويعيش في الأعماق', answers: ['سمكة الأنبوب العميق'] },
        { question: 'سمكة نادرة لها شكل غريب تشبه الورقة', answers: ['سمكة الورقة', 'سمكة الأوراق'] },
        { question: 'أكبر نوع من أسماك القرش في العالم', answers: ['قرش الحوت', 'قرش الحوت العملاق'] },
        { question: 'سمكة لها عيون كبيرة تعيش في الأعماق المظلمة', answers: ['سمكة الفانوس'] }
    ]
};

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🐠 كـائـنـات بـحـريـة 🐠\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: ['سمك', 'بحري'],
    description: '🐠 تخمين الكائن البحري (سمك، حوت، أخطبوط...)',
    category: 'فعاليات',
    usage: '.سمك [سهل|متوسط|صعب]',
    example: '.سمك سهل',

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
                    '💡 مثال: .سمك سهل'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            const levelQuestions = seaCreatures[inputLevel];
            const creature = levelQuestions[Math.floor(Math.random() * levelQuestions.length)];

            // إرسال السؤال
            const lines = [
                `🐟 *خمن الكائن البحري*`,
                ``,
                `❓ ${creature.question}`,
                ``,
                `⏳ الوقت: ${timeMap[inputLevel] / 1000} ثانية`,
                `💰 الجائزة: ${rewardMap[inputLevel]} نقطة`,
                `💔 الخسارة: -${penaltyMap[inputLevel]} نقطة`,
                `🌊 المستوى: ${inputLevel}`,
                ``,
                `📝 اكتب اسم الكائن`
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

                    if (creature.answers.some(a => a.toLowerCase() === txt.trim().toLowerCase())) {
                        finished = true;
                        clearTimeout(timeout);
                        sock.ev.off('messages.upsert', handler);

                        points[winner] = (points[winner] || 0) + rewardMap[inputLevel];
                        saveJSON(pointsPath, points);

                        const resultLines = [
                            `🎉 *إجابة صحيحة!*`,
                            ``,
                            `🏆 الفائز: @${winner.split('@')[0]}`,
                            `🐟 الكائن: *${creature.answers[0]}*`,
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

                // خصم 50 نقطة من صاحب الأمر فقط
                const penalty = penaltyMap[inputLevel];
                points[sender] = Math.max(0, (points[sender] || 0) - penalty);
                saveJSON(pointsPath, points);

                const penaltyLines = [
                    `⏰ *انتهى الوقت!*`,
                    ``,
                    `🐠 الكائن الصحيح: *${creature.answers[0]}*`,
                    ``,
                    `💔 تم خصم ${penalty} نقطة من @${sender.split('@')[0]}`,
                    `💰 نقاطك: ${points[sender]}`,
                    ``,
                    `📌 حاول مرة أخرى مع .سمك`
                ];
                await sendMessage(sock, chatId, penaltyLines, msg, [sender]);
            }, timeMap[inputLevel]);

        } catch (error) {
            console.error('✗ خطأ في أمر سمك:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};