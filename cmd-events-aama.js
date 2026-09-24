// عامة.js - فعالية أسئلة عامة مع خصم نقاط من الخاسر (نسخة محسنة بدون خطوط)
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

// ========== الأسئلة العامة ==========
const questions = [
    // تاريخ وأحداث
    { text: 'في أي عام انتهت الحرب العالمية الثانية؟', answers: ['1945'], reward: 50 },
    { text: 'من هو أول من صعد إلى سطح القمر؟', answers: ['نيل أرمسترونغ', 'ارمسترونغ'], reward: 60 },
    { text: 'من هو مؤسس الدولة الأموية؟', answers: ['معاوية بن أبي سفيان', 'معاوية'], reward: 55 },
    { text: 'ماذا تسمى المعركة التي انتصر فيها صلاح الدين الأيوبي على الصليبيين؟', answers: ['معركة حطين', 'حطين'], reward: 60 },
    { text: 'من هو قائد معركة اليرموك？', answers: ['خالد بن الوليد', 'خالد'], reward: 55 },
    { text: 'ما اسم السفينة التي غرقت في رحلتها الأولى عام 1912؟', answers: ['تيتانيك'], reward: 50 },
    { text: 'من هو أشهر فرعون في تاريخ مصر القديمة؟', answers: ['رمسيس الثاني', 'رمسيس'], reward: 45 },
    { text: 'في أي سنة سقطت الأندلس؟', answers: ['1492'], reward: 60 },
    { text: 'من هو مكتشف نظرية التطور؟', answers: ['تشارلز داروين', 'داروين'], reward: 55 },
    { text: 'من هو العالم الذي وضع قانون الجاذبية؟', answers: ['إسحاق نيوتن', 'نيوتن'], reward: 50 },
    { text: 'ما اسم أول رائد فضاء عربي؟', answers: ['سلطان بن سلمان', 'سلطان'], reward: 65 },
    { text: 'في أي عام تم اكتشاف البنسلين؟', answers: ['1928'], reward: 60 },
    { text: 'من هو مؤسس شركة آبل؟', answers: ['ستيف جوبز', 'جوبز'], reward: 55 },
    { text: 'ما اسم أول مسجد بني في الإسلام؟', answers: ['مسجد قباء', 'قباء'], reward: 50 },
    { text: 'من هو قائد فتح مكة？', answers: ['محمد', 'الرسول'], reward: 45 },

    // جغرافيا طبيعية
    { text: 'ما هو أطول نهر في العالم؟', answers: ['النيل'], reward: 50 },
    { text: 'ما هي أعلى قمة جبلية في العالم؟', answers: ['إيفرست'], reward: 55 },
    { text: 'ما هي أكبر صحراء حارة في العالم？', answers: ['الصحراء الكبرى'], reward: 50 },
    { text: 'ما هو أكبر محيط في العالم؟', answers: ['المحيط الهادئ', 'الهادئ'], reward: 45 },
    { text: 'ما هي أطول سلسلة جبال في العالم？', answers: ['جبال الأنديز', 'الأنديز'], reward: 55 },
    { text: 'ما هو أعمق خندق بحري في العالم？', answers: ['خندق ماريانا', 'ماريانا'], reward: 60 },
    { text: 'ما هي أكبر جزيرة في العالم؟', answers: ['غرينلاند'], reward: 50 },
    { text: 'ما هو أكبر واد في العالم؟', answers: ['وادي النيل'], reward: 45 },
    { text: 'ما هي أكبر بحيرة في العالم من حيث المساحة؟', answers: ['بحر قزوين', 'قزوين'], reward: 55 },
    { text: 'ما هو أطول سور في العالم？', answers: ['سور الصين العظيم'], reward: 50 },
    { text: 'ما هو أعلى شلال في العالم？', answers: ['شلال آنجل', 'آنجل'], reward: 60 },
    { text: 'أين يقع نهر الأمازون؟', answers: ['أمريكا الجنوبية'], reward: 45 },
    { text: 'ما هي الدولة التي تحتوي على أكبر عدد من البراكين النشطة؟', answers: ['إندونيسيا'], reward: 55 },
    { text: 'ما هو أبرد مكان مأهول في العالم？', answers: ['سيبيريا'], reward: 50 },

    // علوم
    { text: 'ما هو العنصر الكيميائي رمزه O？', answers: ['أكسجين'], reward: 40 },
    { text: 'ما هو العنصر الكيميائي رمزه H？', answers: ['هيدروجين'], reward: 40 },
    { text: 'ما هو العنصر الكيميائي رمزه Fe？', answers: ['حديد'], reward: 45 },
    { text: 'ما هو الغاز المستخدم في البالونات ليجعلها تطير？', answers: ['هيليوم'], reward: 50 },
    { text: 'ما هو أقرب كوكب إلى الشمس？', answers: ['عطارد'], reward: 45 },
    { text: 'ما هو أكبر كوكب في المجموعة الشمسية？', answers: ['المشتري'], reward: 45 },
    { text: 'ما هو أبعد كوكب في المجموعة الشمسية？', answers: ['نبتون'], reward: 50 },
    { text: 'ما اسم المجرة التي ننتمي إليها？', answers: ['درب التبانة'], reward: 50 },
    { text: 'ما هو أسرع حيوان بري؟', answers: ['فهد', 'شيتا'], reward: 45 },
    { text: 'ما هو أكبر حيوان في العالم？', answers: ['الحوت الأزرق', 'حوت أزرق'], reward: 45 },
    { text: 'ما هو أطول حيوان في العالم？', answers: ['زرافة'], reward: 40 },
    { text: 'كم عدد أسنان الإنسان البالغ？', answers: ['32'], reward: 40 },
    { text: 'ما هو أقوى عضو في جسم الإنسان？', answers: ['اللسان'], reward: 50 },
    { text: 'كم عدد عظام جسم الإنسان البالغ？', answers: ['206'], reward: 50 },

    // دين
    { text: 'ما هي السورة التي تسمى "قلب القرآن"؟', answers: ['سورة يس', 'يس'], reward: 50 },
    { text: 'من هو النبي الذي ابتلعه الحوت؟', answers: ['يونس', 'يونس عليه السلام'], reward: 45 },
    { text: 'من هو النبي الذي أنعم الله عليه بالنبوة وهو طفل？', answers: ['يحيى', 'يحيى عليه السلام'], reward: 55 },
    { text: 'ما اسم أم موسى عليه السلام؟', answers: ['يوكابد'], reward: 60 },
    { text: 'كم عدد أركان الإسلام؟', answers: ['5', 'خمسة'], reward: 35 },
    { text: 'كم عدد أركان الإيمان؟', answers: ['6', 'ستة'], reward: 35 },
    { text: 'ما هي أول غزوة في الإسلام؟', answers: ['غزوة الأبواء', 'الأبواء'], reward: 60 },
    { text: 'من هو الصحابي الملقب بـ "أسد الله"؟', answers: ['حمزة بن عبد المطلب', 'حمزة'], reward: 55 },

    // رياضة
    { text: 'من هو أفضل لاعب كرة قدم في العالم لعام 2022؟', answers: ['ليونيل ميسي', 'ميسي'], reward: 50 },
    { text: 'من هو أكثر لاعب فوزاً بجائزة الكرة الذهبية？', answers: ['ليونيل ميسي', 'ميسي'], reward: 55 },
    { text: 'من هو لاعب كرة السلة الشهير الذي لعب مع شيكاغو بولز？', answers: ['مايكل جوردان', 'جوردان'], reward: 50 },
    { text: 'ما هي الرياضة التي تسمى "رياضة الملوك"？', answers: ['الشطرنج'], reward: 45 },
    { text: 'كم عدد اللاعبين في فريق كرة القدم？', answers: ['11'], reward: 30 },
    { text: 'من هو بطل كأس العالم 2022？', answers: ['الأرجنتين', 'ارجنتين'], reward: 50 },
    { text: 'من هو حامل لقب الدوري الإنجليزي الممتاز 2023？', answers: ['مانشستر سيتي', 'سيتي'], reward: 55 },

    // مشاهير وفن
    { text: 'من هو مغني أغنية "Shape of You"؟', answers: ['إد شيران', 'شيران'], reward: 50 },
    { text: 'من هي مغنية أغنية "Hello"؟', answers: ['أديل'], reward: 50 },
    { text: 'من هو مخرج فيلم "Interstellar"؟', answers: ['كريستوفر نولان', 'نولان'], reward: 55 },
    { text: 'من هو بطل فيلم "Gladiator"؟', answers: ['راسل كرو'], reward: 50 },
    { text: 'من هي الممثلة التي أدت دور "هيرميون" في هاري بوتر？', answers: ['إيما واتسون', 'واتسون'], reward: 55 },
    { text: 'من هو الفنان التشكيلي صاحب لوحة "الموناليزا"？', answers: ['ليوناردو دافنشي', 'دافنشي'], reward: 50 },
    { text: 'من هو مؤلف رواية "الأمير الصغير"؟', answers: ['أنطوان دو سانت إكزوبيري', 'سانت إكزوبيري'], reward: 55 },
    { text: 'من هو مؤلف رواية "الجريمة والعقاب"؟', answers: ['دوستويفسكي'], reward: 60 },
    { text: 'من هو مؤلف رواية "مئة عام من العزلة"؟', answers: ['غابرييل غارسيا ماركيز', 'ماركيز'], reward: 60 },

    // ألغاز
    { text: 'ما هو الشيء الذي كلما زاد نقص؟', answers: ['العمر', 'الحفرة'], reward: 60 },
    { text: 'ما هو الشيء الذي يمشي بلا أقدام ويطير بلا أجنحة ويبكي بلا عيون？', answers: ['السحاب', 'الغيوم'], reward: 70 },
    { text: 'ما هو الشيء الذي يكون أخضر في الأرض وأسود في السوق وأحمر في البيت？', answers: ['الشاي', 'القهوة'], reward: 65 },
    { text: 'ما هو الشيء الذي تراه ولا يراك؟', answers: ['المرآة'], reward: 60 },
    { text: 'ما هو الشيء الذي كلما أخذت منه كبر؟', answers: ['الحفرة'], reward: 55 },
    { text: 'ما هو الشيء الذي يدخل الماء ولا يبتل؟', answers: ['الضوء', 'النار'], reward: 65 },

    // أكلات
    { text: 'ما هي الأكلة المصرية الشهيرة المصنوعة من الفول？', answers: ['طعمية', 'فلافل'], reward: 45 },
    { text: 'ما هي الأكلة الإيطالية الشهيرة المكونة من العجين والجبن والصلصة؟', answers: ['بيتزا'], reward: 40 },
    { text: 'ما هي الحلوى التركية الشهيرة المصنوعة من السميد والسكر？', answers: ['كنافة', 'بسبوسة'], reward: 50 },
    { text: 'ما هو المشروب السعودي التقليدي المصنوع من القهوة؟', answers: ['قهوة', 'قهوة سعودية'], reward: 45 },
    { text: 'ما هي الأكلة اليابانية الشهيرة المكونة من الأرز والسمك النيء？', answers: ['سوشي'], reward: 50 },
    { text: 'ما هي الأكلة الهندية الحارة المصنوعة من العدس؟', answers: ['دال', 'دال ماخاني'], reward: 55 },

    // حيوانات
    { text: 'أي حيوان يسمى بـ "سفينة الصحراء"؟', answers: ['جمل'], reward: 40 },
    { text: 'أي حيوان يغير لونه حسب البيئة؟', answers: ['حرباء'], reward: 45 },
    { text: 'أي حيوان ينام واقفاً？', answers: ['حصان', 'حمار'], reward: 45 },
    { text: 'أي حيوان له ذراعان فقط؟', answers: ['إنسان'], reward: 50 },
    { text: 'ما هو أطول حيوان بري؟', answers: ['زرافة'], reward: 40 },
    { text: 'ما هي أسرع سمكة في المحيط؟', answers: ['سمكة أبو شراع', 'شراع'], reward: 60 },
    { text: 'ما هو أكبر طائر في العالم؟', answers: ['نعامة'], reward: 40 },

    // أشهر وألقاب
    { text: 'من هو الملقب بـ "أمير الشعراء"؟', answers: ['أحمد شوقي', 'شوقي'], reward: 55 },
    { text: 'من هو الملقب بـ "ملك البوب"؟', answers: ['مايكل جاكسون', 'جاكسون'], reward: 50 },
    { text: 'من هو الملقب بـ "شيخ المخرجين" في مصر؟', answers: ['يوسف شاهين', 'شاهين'], reward: 60 },
    { text: 'من هو الملقب بـ "أسد الصحراء"؟', answers: ['عمر المختار'], reward: 55 },

    // تقنية
    { text: 'ما هو نظام التشغيل الأكثر شهرة للهواتف من آبل？', answers: ['iOS'], reward: 45 },
    { text: 'من هو مؤسس فيسبوك？', answers: ['مارك زوكربيرغ', 'زوكربيرغ'], reward: 50 },
    { text: 'من هو مؤسس تويتر؟', answers: ['جاك دورسي', 'دورسي'], reward: 55 },

    // متفرقات
    { text: 'كم عدد ألوان قوس قزح？', answers: ['7', 'سبعة'], reward: 30 },
    { text: 'ما هو لون الدم عندما يكون مؤكسجاً؟', answers: ['أحمر فاتح', 'أحمر'], reward: 40 },
    { text: 'ما هو لون الليمون الناضج？', answers: ['أصفر'], reward: 30 },
    { text: 'من هو أول من اخترع الطائرة؟', answers: ['الأخوان رايت', 'رايت'], reward: 55 }
];

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🎓 سـؤال عـام ثـقـافـي 🎓\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: ['عامة'],
    description: '🎓 سؤال عام ثقافي (تاريخ، جغرافيا، علوم، رياضة، أدب، ألغاز)',
    category: 'فعاليات',
    usage: '.عامة',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
            const points = loadJSON(pointsPath);

            const question = questions[Math.floor(Math.random() * questions.length)];
            let finished = false;

            // إرسال السؤال
            const lines = [
                `📜 ${question.text}`,
                ``,
                `⏳ الوقت: 30 ثانية`,
                `🏆 الجائزة: ${question.reward} نقطة`,
                `💔 الخسارة: -${question.reward} نقطة`,
                ``,
                `✨ أول من يجيب إجابة صحيحة يفوز!`
            ];

            await sendMessage(sock, chatId, lines, msg, [sender]);

            const handler = async ({ messages }) => {
                if (finished) return;
                for (const m of messages) {
                    if (m.key.remoteJid !== chatId) continue;
                    const responder = m.key.participant || m.participant || m.key.remoteJid;
                    const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                    if (!txt) continue;

                    const clean = txt.trim().toLowerCase();
                    if (question.answers.some(a => a.toLowerCase() === clean)) {
                        finished = true;
                        clearTimeout(timeout);
                        sock.ev.off('messages.upsert', handler);

                        points[responder] = (points[responder] || 0) + question.reward;
                        saveJSON(pointsPath, points);

                        const resultLines = [
                            `🎉 *إجابة صحيحة!*`,
                            ``,
                            `👑 الفائز: @${responder.split('@')[0]}`,
                            `📖 الإجابة: ${question.answers[0]}`,
                            `⭐ +${question.reward} نقطة`,
                            `💰 نقاطك: ${points[responder]}`,
                            `🏅 رتبتك: ${getLevel(points[responder])}`,
                            ``,
                            `🥳 تهانينا!`
                        ];
                        await sendMessage(sock, chatId, resultLines, m, [responder]);
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
                const penalty = question.reward;
                points[sender] = Math.max(0, (points[sender] || 0) - penalty);
                saveJSON(pointsPath, points);

                const timeoutLines = [
                    `⏰ *انتهى الوقت!*`,
                    ``,
                    `📖 الإجابة الصحيحة هي: *${question.answers[0]}*`,
                    ``,
                    `💔 تم خصم ${penalty} نقطة من @${sender.split('@')[0]}`,
                    `💰 نقاطك: ${points[sender]}`,
                    ``,
                    `📌 استخدم الأمر .عامة مرة أخرى للعب.`
                ];
                await sendMessage(sock, chatId, timeoutLines, msg, [sender]);
            }, 30000);

        } catch (error) {
            console.error('✗ خطأ في أمر عامة:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};