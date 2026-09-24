// فيلم.js - فعالية تخمين الأفلام (نسخة محسنة بدون خطوط)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const kingdomPath = path.join(__dirname, 'db-kingdom.json');

if (!fs.existsSync(__dirname)) fs.mkdirSync(__dirname, { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(kingdomPath)) fs.writeFileSync(kingdomPath, JSON.stringify({}, null, 2));

function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

const rewardMap = { سهل: 50, متوسط: 100, صعب: 200 };
const penaltyMap = { سهل: 50, متوسط: 100, صعب: 200 };
const timeMap = { سهل: 10000, متوسط: 15000, صعب: 20000 };

// ========== بنك الأفلام ==========
const movies = {
    سهل: [
        {
            question: 'فيلم مصري بطولة محمد هنيدي عن شاب فقير يقع في حب فتاة من عائلة ثرية',
            answers: ['صعيدي في الجامعة الأمريكية']
        },
        {
            question: 'فيلم مصري بطولة أحمد حلمي عن شاب يستيقظ كل يوم في تاريخ مختلف',
            answers: ['عصابة الدكتور عمر']
        },
        {
            question: 'فيلم مصري بطولة محمد سعد عن شاب مشهور بلقب اللمبي',
            answers: ['اللمبي']
        },
        {
            question: 'فيلم مصري بطولة أحمد السقا ومنى زكي عن شاب يحاول الزواج من حبيبته',
            answers: ['تيمور وشفيقة']
        },
        {
            question: 'فيلم عالمي عن سفينة اصطدمت بجبل جليدي وغرقت',
            answers: ['تايتانك', 'تيتانيك']
        },
        {
            question: 'فيلم عالمي عن صبي ساحر يدرس في مدرسة هوجوورتس',
            answers: ['هاري بوتر']
        },
        {
            question: 'فيلم مصري بطولة كريم عبد العزيز عن ضابط شرطة يطارد تجار المخدرات',
            answers: ['الباشا تلميذ']
        },
        {
            question: 'فيلم مصري بطولة محمد هنيدي عن شاب يعمل حارس أمن',
            answers: ['وش إجرام']
        },
        {
            question: 'فيلم مصري بطولة أحمد مكي عن شقيقين توأم أحدهما مجرم',
            answers: ['لا تراجع ولا استسلام']
        },
        {
            question: 'فيلم مصري بطولة رامز جلال عن شاب يقع في مواقف كوميدية بسبب الشبه',
            answers: ['أحلام الفتى الطايش']
        },
        {
            question: 'فيلم مصري بطولة محمد هنيدي عن شاب في حي شعبي يحلم بالغناء',
            answers: ['همام في أمستردام']
        },
        {
            question: 'فيلم مصري بطولة أحمد حلمي عن شاب يعمل في شركة اتصالات',
            answers: ['خيال مآتة']
        },
        {
            question: 'فيلم عالمي عن حرب النجوم وصراع بين الخير والشر',
            answers: ['حرب النجوم', 'ستار وورز']
        },
        {
            question: 'فيلم عالمي عن رجل يتجول في زمن الديناصورات',
            answers: ['جوراسيك بارك']
        },
        {
            question: 'فيلم مصري بطولة محمد سعد عن شاب في حارة شعبية',
            answers: ['بحب السيما']
        }
    ],

    متوسط: [
        {
            question: 'فيلم مصري بطولة أحمد حلمي عن شاب مصري يعود من أمريكا بعد سنوات طويلة',
            answers: ['عسل أسود']
        },
        {
            question: 'فيلم مصري بطولة كريم عبد العزيز وخالد الصاوي عن طبيب نفسي يواجه أسراراً غامضة',
            answers: ['الفيل الأزرق']
        },
        {
            question: 'فيلم مصري بطولة أحمد عز عن ضابط مكافحة مخدرات',
            answers: ['المصلحة']
        },
        {
            question: 'فيلم مصري بطولة محمد رمضان عن شاب يخرج من السجن ويسعى للانتقام',
            answers: ['عبده موتة']
        },
        {
            question: 'فيلم مصري بطولة كريم عبد العزيز وأحمد عز عن صراع بين ضابط ومافيا',
            answers: ['كيرة والجن']
        },
        {
            question: 'فيلم عالمي عن مجموعة أبطال خارقين يجتمعون لإنقاذ العالم',
            answers: ['المنتقمون', 'افنجرز', 'ذا افنجرز']
        },
        {
            question: 'فيلم مصري بطولة ماجد الكدواني عن رجل يكتشف أن لديه ابناً',
            answers: ['هيبتا']
        },
        {
            question: 'فيلم مصري بطولة أحمد السقا عن سائق شاحنات يدخل عالم الجريمة',
            answers: ['تيتو']
        },
        {
            question: 'فيلم عالمي عن رجل يرتدي بدلة حديدية متطورة',
            answers: ['ايرون مان', 'الرجل الحديدي']
        },
        {
            question: 'فيلم مصري بطولة محمد هنيدي عن شاب يذهب في رحلة البحث عن عمل',
            answers: ['كداب']
        },
        {
            question: 'فيلم مصري بطولة أحمد عز عن رجل أعمال يواجه مؤامرة',
            answers: ['الرحلة']
        },
        {
            question: 'فيلم عالمي عن سفينة فضاء تتعرض لهجوم من كائنات فضائية',
            answers: ['فضائي', 'ألين']
        },
        {
            question: 'فيلم عالمي عن جاسوس بريطاني يحمل رقم 007',
            answers: ['جيمس بوند', 'العميل 007']
        },
        {
            question: 'فيلم مصري بطولة كريم عبد العزيز عن شاب يبحث عن أخيه',
            answers: ['الغابة']
        },
        {
            question: 'فيلم عالمي عن حرب في الفضاء بين البشر والروبوتات',
            answers: ['ماتريكس', 'ذا ماتريكس']
        }
    ],

    صعب: [
        {
            question: 'فيلم مصري قديم بطولة فؤاد المهندس وشويكار عن زوجين كثيري الخلافات',
            answers: ['أخطر رجل في العالم']
        },
        {
            question: 'فيلم مصري بطولة نور الشريف عن تاجر مخدرات شهير',
            answers: ['العار']
        },
        {
            question: 'فيلم مصري بطولة محمود عبد العزيز ويحيى الفخراني عن تجارة المخدرات',
            answers: ['الكيف']
        },
        {
            question: 'فيلم مصري بطولة أحمد زكي عن حياة الرئيس جمال عبد الناصر',
            answers: ['ناصر 56']
        },
        {
            question: 'فيلم مصري بطولة أحمد زكي عن قصة عبد الحليم حافظ',
            answers: ['حليم']
        },
        {
            question: 'فيلم عالمي صدر عام 1994 عن سجين يهرب بعد سنوات طويلة',
            answers: ['الخلاص من شاوشانك', 'شاوشانك', 'the shawshank redemption']
        },
        {
            question: 'فيلم عالمي عن زعيم مافيا من عائلة كورليوني',
            answers: ['العراب', 'the godfather']
        },
        {
            question: 'فيلم عالمي عن محقق يطارد قاتلاً متسلسلاً يرتكب جرائمه وفق الخطايا السبع',
            answers: ['seven', 'se7en']
        },
        {
            question: 'فيلم مصري بطولة عادل إمام عن شاهد بسيط يتورط مع عصابة',
            answers: ['شاهد ما شفش حاجة']
        },
        {
            question: 'فيلم عالمي عن حلم داخل حلم داخل حلم',
            answers: ['inception', 'استهلال']
        },
        {
            question: 'فيلم مصري بطولة محمود عبد العزيز عن رجل يعيش في منطقة نائية',
            answers: ['الرجل الحديدي']
        },
        {
            question: 'فيلم عالمي عن طبيب نفسي يحاول علاج مريض خطير',
            answers: ['سايكو', 'psycho']
        },
        {
            question: 'فيلم عالمي عن شاب يتحول إلى ذبابة في تجربة علمية',
            answers: ['الذبابة', 'the fly']
        },
        {
            question: 'فيلم مصري بطولة نور الشريف عن قصة عائلة ثرية',
            answers: ['أهل القمة']
        },
        {
            question: 'فيلم عالمي عن عائلة تتعرض لهجوم من مخلوقات غريبة في منزلها',
            answers: ['فضائيين', 'poltergeist']
        }
    ]
};

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🎬 فـعـالـيـة الـأفـلام 🎬\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: 'فيلم',
    description: '🎬 تخمين اسم الفيلم (تركيز على السينما المصرية والعالمية)',
    category: 'فعاليات',
    usage: '.فيلم [سهل|متوسط|صعب]',
    example: '.فيلم سهل',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;

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
                    '💡 مثال: .فيلم سهل'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            const levelQuestions = movies[inputLevel];
            const movie = levelQuestions[Math.floor(Math.random() * levelQuestions.length)];

            const points = loadJSON(pointsPath);
            const kingdomData = loadJSON(kingdomPath);

            // إرسال السؤال
            const lines = [
                `🎬 *خمن الفيلم*`,
                ``,
                `❓ ${movie.question}`,
                ``,
                `⏳ الوقت: ${timeMap[inputLevel] / 1000} ثانية`,
                `💰 الجائزة: ${rewardMap[inputLevel]} نقطة`,
                `🎥 المستوى: ${inputLevel}`,
                ``,
                `📝 اكتب اسم الفيلم`
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

                    if (movie.answers.some(a => a.toLowerCase() === txt.trim().toLowerCase())) {
                        finished = true;
                        clearTimeout(timeout);
                        sock.ev.off('messages.upsert', handler);

                        points[winner] = (points[winner] || 0) + rewardMap[inputLevel];
                        saveJSON(pointsPath, points);

                        const resultLines = [
                            `🎉 *إجابة صحيحة!*`,
                            ``,
                            `🏆 الفائز: @${winner.split('@')[0]}`,
                            `🎬 الفيلم: *${movie.answers[0]}*`,
                            `⭐ +${rewardMap[inputLevel]} نقطة`,
                            `💰 نقاطك: ${points[winner]}`,
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
                    if (kingdomData[jid]) {
                        points[jid] = Math.max(0, (points[jid] || 0) - penaltyMap[inputLevel]);
                        deductedCount++;
                    }
                }

                saveJSON(pointsPath, points);

                const penaltyLines = [
                    `⏰ *انتهى الوقت!*`,
                    ``,
                    `🎬 الفيلم الصحيح: *${movie.answers[0]}*`,
                    ``,
                    `💔 تم خصم ${penaltyMap[inputLevel]} نقطة`,
                    ``,
                    `📌 حاول مرة أخرى مع .فيلم`
                ];
                await sendMessage(sock, chatId, penaltyLines, msg);
            }, timeMap[inputLevel]);

        } catch (error) {
            console.error('✗ خطأ في أمر فيلم:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};