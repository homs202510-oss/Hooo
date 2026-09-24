// مفرد.js - فعالية مفرد الكلمة مع نقاط (50 فوز، 50 خسارة) - نسخة موسعة
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const kingdomPath = path.join(__dirname, 'db-kingdom.json');

if (!fs.existsSync(__dirname)) fs.mkdirSync(__dirname, { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(kingdomPath)) fs.writeFileSync(kingdomPath, JSON.stringify({}, null, 2));

function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// ================================
// 🧠 بنك أسئلة مفرد الكلمة بالمستويات (موسع جداً)
// ================================

const mofradWords = {
    سهل: [
        { q: "كتب", a: "كتاب" },
        { q: "اقلام", a: "قلم" },
        { q: "بيوت", a: "بيت" },
        { q: "اولاد", a: "ولد" },
        { q: "مدن", a: "مدينة" },
        { q: "بحار", a: "بحر" },
        { q: "عيون", a: "عين" },
        { q: "ابواب", a: "باب" },
        { q: "شوارع", a: "شارع" },
        { q: "مساجد", a: "مسجد" },
        { q: "قصص", a: "قصة" },
        { q: "ايام", a: "يوم" },
        { q: "شهور", a: "شهر" },
        { q: "ساعات", a: "ساعة" },
        { q: "كراسي", a: "كرسي" },
        { q: "طاولات", a: "طاولة" },
        { q: "ورود", a: "وردة" },
        { q: "اشجار", a: "شجرة" },
        { q: "طيور", a: "طائر" },
        { q: "اسماك", a: "سمكة" },
        { q: "بيض", a: "بيضة" },
        { q: "خبز", a: "رغيف" },
        { q: "لحوم", a: "لحم" },
        { q: "فواكه", a: "فاكهة" },
        { q: "خضروات", a: "خضار" },
        { q: "حلويات", a: "حلوى" },
        { q: "مفاتيح", a: "مفتاح" },
        { q: "هواتف", a: "هاتف" },
        { q: "اكياس", a: "كيس" },
        { q: "صناديق", a: "صندوق" },
        { q: "قوارير", a: "قارورة" },
        { q: "ازهار", a: "زهرة" },
        { q: "غيوم", a: "غيمة" },
        { q: "نجوم", a: "نجمة" },
        { q: "كواكب", a: "كوكب" },
        { q: "ايادي", a: "يد" },
        { q: "ارجل", a: "رجل" },
        { q: "اذان", a: "اذن" },
        { q: "انوف", a: "انف" },
        { q: "افواه", a: "فم" },
        { q: "اسنان", a: "سن" },
        { q: "شوارب", a: "شارب" },
        { q: "لحى", a: "لحية" },
        { q: "شعر", a: "شعرة" },
        { q: "جلود", a: "جلد" }
    ],

    متوسط: [
        { q: "رجال", a: "رجل" },
        { q: "نساء", a: "امرأة" },
        { q: "اطفال", a: "طفل" },
        { q: "شيوخ", a: "شيخ" },
        { q: "ملوك", a: "ملك" },
        { q: "طرق", a: "طريق" },
        { q: "اشخاص", a: "شخص" },
        { q: "نوافذ", a: "نافذة" },
        { q: "طلاب", a: "طالب" },
        { q: "جنود", a: "جندي" },
        { q: "قادة", a: "قائد" },
        { q: "وزراء", a: "وزير" },
        { q: "مشاكل", a: "مشكلة" },
        { q: "افكار", a: "فكرة" },
        { q: "حكومات", a: "حكومة" },
        { q: "برلمانات", a: "برلمان" },
        { q: "قوانين", a: "قانون" },
        { q: "انتخابات", a: "انتخاب" },
        { q: "احزاب", a: "حزب" },
        { q: "صحف", a: "صحيفة" },
        { q: "مجلات", a: "مجلة" },
        { q: "مكتبات", a: "مكتبة" },
        { q: "مدارس", a: "مدرسة" },
        { q: "جامعات", a: "جامعة" },
        { q: "معاهد", a: "معهد" },
        { q: "مراكز", a: "مركز" },
        { q: "مستشفيات", a: "مستشفى" },
        { q: "عيادات", a: "عيادة" },
        { q: "صيدليات", a: "صيدلية" },
        { q: "مطاعم", a: "مطعم" },
        { q: "مقاهي", a: "مقهى" },
        { q: "فنادق", a: "فندق" },
        { q: "شقق", a: "شقة" },
        { q: "فلل", a: "فيلا" },
        { q: "قصور", a: "قصر" },
        { q: "جسور", a: "جسر" },
        { q: "انفاق", a: "نفق" },
        { q: "مطارات", a: "مطار" },
        { q: "موانئ", a: "ميناء" },
        { q: "حدائق", a: "حديقة" },
        { q: "متنزهات", a: "متنزه" },
        { q: "ملاعب", a: "ملعب" },
        { q: "مسارح", a: "مسرح" },
        { q: "متاحف", a: "متحف" },
        { q: "مكتبات", a: "مكتبة" }
    ],

    صعب: [
        { q: "رؤساء", a: "رئيس" },
        { q: "اوامر", a: "امر" },
        { q: "اسئلة", a: "سؤال" },
        { q: "اجوبة", a: "جواب" },
        { q: "اشياء", a: "شيء" },
        { q: "اصوات", a: "صوت" },
        { q: "اسلحة", a: "سلاح" },
        { q: "رجال اعمال", a: "رجل اعمال" },
        { q: "حسابات", a: "حساب" },
        { q: "ملفات", a: "ملف" },
        { q: "برامج", a: "برنامج" },
        { q: "مواقف", a: "موقف" },
        { q: "قرارات", a: "قرار" },
        { q: "بشر", a: "انسان" },
        { q: "علماء", a: "عالم" },
        { q: "ادباء", a: "اديب" },
        { q: "شعراء", a: "شاعر" },
        { q: "رسامون", a: "رسام" },
        { q: "اطباء", a: "طبيب" },
        { q: "محامون", a: "محامي" },
        { q: "مهندسون", a: "مهندس" },
        { q: "موسيقيون", a: "موسيقي" },
        { q: "صيادلة", a: "صيدلي" },
        { q: "قضاة", a: "قاضي" },
        { q: "معلمون", a: "معلم" },
        { q: "اساتذة", a: "استاذ" },
        { q: "طلاب علم", a: "طالب علم" },
        { q: "باحثون", a: "باحث" },
        { q: "مخترعون", a: "مخترع" },
        { q: "مستكشفون", a: "مستكشف" },
        { q: "رواد فضاء", a: "رائد فضاء" },
        { q: "سياسيون", a: "سياسي" },
        { q: "دبلوماسيون", a: "دبلوماسي" },
        { q: "مفكرون", a: "مفكر" },
        { q: "فلاسفة", a: "فيلسوف" },
        { q: "مؤرخون", a: "مؤرخ" },
        { q: "جغرافيون", a: "جغرافي" },
        { q: "لغويون", a: "لغوي" },
        { q: "نحاة", a: "نحوي" },
        { q: "بلاغيون", a: "بلاغي" },
        { q: "صحفيون", a: "صحفي" },
        { q: "مراسلون", a: "مراسل" },
        { q: "مذيعون", a: "مذيع" },
        { q: "مخرجون", a: "مخرج" },
        { q: "منتجون", a: "منتج" }
    ]
};

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `🧠 فـعـالـيـة مـفـرد الـكـلـمـة 🧠\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: 'مفرد',
    description: '🧠 فعالية مفرد كلمة بمستويات (50 فوز، 50 خسارة)',
    usage: '.مفرد [سهل | متوسط | صعب]',
    category: 'فعاليات',

    async execute(sock, m) {
        try {
            const chatId = m.key.remoteJid;
            const fullText = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/).slice(1);
            
            let level = args[0] || 'سهل';

            if (!['سهل', 'متوسط', 'صعب'].includes(level)) {
                level = 'سهل';
            }

            const words = mofradWords[level];
            const chosen = words[Math.floor(Math.random() * words.length)];

            const correctAnswer = chosen.a.trim().toLowerCase();

            // ===== إرسال السؤال =====
            const lines = [
                `📚 المستوى: *${level}* (${words.length} سؤال)`,
                ``,
                `❓ ما هو مفرد كلمة:`,
                `「 ${chosen.q} 」`,
                ``,
                `⏳ الوقت: 20 ثانية`,
                `🏆 الفوز: +50 نقطة | 💔 الخسارة: -50 نقطة`,
                ``,
                `📝 اكتب الإجابة في رسالة`
            ];

            await sendMessage(sock, chatId, lines, m);

            let ended = false;

            const handler = async ({ messages }) => {
                for (const msg of messages) {
                    if (ended) return;
                    if (msg.key.remoteJid !== chatId) continue;

                    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                    if (!text) continue;

                    if (text.trim().toLowerCase() === correctAnswer) {
                        ended = true;
                        clearTimeout(timeout);
                        sock.ev.off('messages.upsert', handler);

                        const winner = msg.key.participant || msg.participant || msg.key.remoteJid;

                        // ===== إضافة نقاط للفائز =====
                        const points = loadJSON(pointsPath);
                        const kingdomData = loadJSON(kingdomPath);

                        if (!kingdomData[winner]) {
                            await sendMessage(sock, chatId, [
                                `❌ @${winner.split('@')[0]}، ليس لديك مملكة.`,
                                '📌 استخدم .لاعب جديد لتأسيس مملكتك.'
                            ], msg, [winner]);
                            return;
                        }

                        points[winner] = (points[winner] || 0) + 50;
                        saveJSON(pointsPath, points);

                        const winLines = [
                            `👑 الفائز: @${winner.split('@')[0]}`,
                            ``,
                            `📖 ${chosen.q} ⇢ ${chosen.a}`,
                            ``,
                            `🎉 تهانينا! إجابة صحيحة!`,
                            `💰 +50 نقطة`,
                            `📊 رصيدك: ${points[winner]} نقطة`
                        ];

                        await sendMessage(sock, chatId, winLines, msg, [winner]);
                    }
                }
            };

            sock.ev.on('messages.upsert', handler);

            const timeout = setTimeout(async () => {
                if (ended) return;
                ended = true;
                sock.ev.off('messages.upsert', handler);

                // ===== خصم 50 نقطة من جميع المشاركين =====
                const points = loadJSON(pointsPath);
                const kingdomData = loadJSON(kingdomPath);

                const metadata = await sock.groupMetadata(chatId);
                let deductedCount = 0;

                for (const participant of metadata.participants) {
                    const jid = participant.id;
                    if (kingdomData[jid]) {
                        points[jid] = Math.max(0, (points[jid] || 0) - 50);
                        deductedCount++;
                    }
                }

                saveJSON(pointsPath, points);

                const timeoutLines = [
                    `⏰ انتهى الوقت!`,
                    ``,
                    `الإجابة الصحيحة هي:`,
                    `${chosen.q} ⇢ ${chosen.a}`,
                    ``,
                    `💔 تم خصم 50 نقطة من ${deductedCount} مشارك${deductedCount > 1 ? 'ين' : ''}`,
                    ``,
                    `📌 حاول مرة أخرى مع .مفرد`
                ];

                await sendMessage(sock, chatId, timeoutLines, m);
            }, 20000);

        } catch (error) {
            console.error('✗ خطأ في أمر مفرد:', error);
            await sendMessage(sock, m.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};