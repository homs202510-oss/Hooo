// مسلسل.js - تخمين اسم المسلسل حسب الوصف (نسخة مستقلة بدون مملكة)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

if (!fs.existsSync(__dirname)) fs.mkdirSync(__dirname, { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));

function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// ========== جائزة وعقوبة ==========
const rewardMap = { سهل: 50, متوسط: 100, صعب: 200 };
const penaltyMap = { سهل: 50, متوسط: 100, صعب: 200 };
const timeMap = { سهل: 10000, متوسط: 15000, صعب: 20000 };

// ========== بنك الأسئلة ==========
const series = {
    سهل: [
        { question: 'مسلسل مصري كوميدي عن عيلة في منطقة شعبية، الشخصيات: سيد، فكري، منى، غزل', answers: ['الكبير أوي'] },
        { question: 'مسلسل بطولة يحيى الفخراني عن طبيب أطفال يعاني من ضمور في عضلاته', answers: ['العمدة'] },
        { question: 'مسلسل تاريخي عن أسرة بدوية في سيناء أيام الاحتلال', answers: ['الأخوة الأعداء'] },
        { question: 'مسلسل مصري قديم جداً بطولة صلاح ذو الفقار، عن الصعيد', answers: ['راس الغول'] },
        { question: 'مسلسل بيحكي قصة حرب أكتوبر من وجهة نظر ضابط مخابرات (يحيى الفخراني)', answers: ['أبو العروسة'] },
        { question: 'مسلسل بطولة أحمد مكي عن شاب بيشتغل كاتب في جريدة وبيقع في مشاكل', answers: ['الكبير أوي 2'] },
        { question: 'مسلسل نادر جلال عن قاضي بيحقق في قضايا قتل غامضة', answers: ['القاصرات'] },
        { question: 'مسلسل بطولة ماجد الكدواني عن ضابط في البحث الجنائي', answers: ['سقف العالم'] },
        { question: 'مسلسل تركي مدبلج عن السلطان سليمان القانوني', answers: ['حريم السلطان'] },
        { question: 'مسلسل خليجي كوميدي عن عائلة سعودية', answers: ['طاش ما طاش'] },
        { question: 'مسلسل مصري بطولة محمد هنيدي عن شاب بيشتغل في شركة اتصالات', answers: ['راجل وست ستات'] },
        { question: 'مسلسل بطولة هاني سلامة عن ضابط شرطة في منطقة صعيدية', answers: ['الضابط'] },
        { question: 'مسلسل خليجي عن عائلة كويتية في فترة الثمانينات', answers: ['سعدون'] },
        { question: 'مسلسل مصري كوميدي بطولة أحمد رزق عن سائق تاكسي', answers: ['جراج'] },
        { question: 'مسلسل عن حياة الصحابي خالد بن الوليد', answers: ['خالد بن الوليد'] }
    ],
    متوسط: [
        { question: 'مسلسل مصري بطولة نور الشريف عن صراع الصعيد، مقتبس من رواية نجيب محفوظ', answers: ['لن أعيش في جلباب أبي'] },
        { question: 'مسلسل درامي تاريخي عن عائلة مصرية من أول الثورة العرابية للخمسينات', answers: ['ليالي الحلمية'] },
        { question: 'مسلسل مصري كوميدي عن رجل لديه 3 زوجات وكل واحدة في شقة', answers: ['الحفار'] },
        { question: 'مسلسل بطولة عادل إمام عن تاجر مخدرات في الإسكندرية', answers: ['العراف'] },
        { question: 'مسلسل بيحكي سيرة حياة الشيخ عبد الحليم محمود', answers: ['إمام الدعاة'] },
        { question: 'مسلسل مصري بيحكي قصة عيلة مرت على فترات زمنية مختلفة', answers: ['ونيس'] },
        { question: 'مسلسل اجتماعي بطولة يحيى الفخراني عن أستاذ جامعي متقاعد', answers: ['الأستاذ'] },
        { question: 'مسلسل خليجي تاريخي عن حياة الملك عبد العزيز آل سعود', answers: ['ملوك الطوائف'] },
        { question: 'مسلسل تركي مدبلج عن حياة رجل أعمال وإبنه', answers: ['بيت الطيب'] },
        { question: 'مسلسل مصري بطولة أحمد حلمي عن شاب بيشتغل "نص ساعة" في اليوم', answers: ['نص ساعة'] },
        { question: 'مسلسل مصري بطولة محمد رمضان عن صعيدي في القاهرة', answers: ['نسر الصعيد'] },
        { question: 'مسلسل بطولة يوسف الشريف عن جاسوس مصري في إسرائيل', answers: ['سلسال الدم'] },
        { question: 'مسلسل تاريخي عن الدولة العثمانية بطولة محمد فتحي', answers: ['قيامة أرطغرل'] },
        { question: 'مسلسل مصري درامي عن عائلة ثرية في الزمالك', answers: ['بين السرايات'] },
        { question: 'مسلسل بطولة غادة عبد الرازق عن سيدة أعمال', answers: ['الزوجة الرابعة'] }
    ],
    صعب: [
        { question: 'مسلسل بطولة محمود عبد العزيز عن رجل بلا هوية يسكن في المنطقة الحرة', answers: ['الرجل الحر'] },
        { question: 'مسلسل درامي مصري قديم جدا (1970) عن الصراع بين العيلة', answers: ['الرحيل'] },
        { question: 'مسلسل سيرة ذاتية عن حياة الفنان سيد درويش', answers: ['الزير سالم'] },
        { question: 'مسلسل تاريخي عن الصحابي عمر بن الخطاب (إنتاج قطري)', answers: ['عمر'] },
        { question: 'مسلسل من بطولة فردوس عبد الحميد يابنت الغلابة', answers: ['ليالي الحلمية ج2'] },
        { question: 'مسلسل أمريكي شهير عن عائلة من نيوجيرسي', answers: ['عائلة سوبرانو'] },
        { question: 'مسلسل مصري قصير (سيت كوم) عن شركة إعلانات', answers: ['تيتو والملاك'] },
        { question: 'مسلسل مصري بيحكي قصة سيدة أعمال اسمها (تحية) تحاول تنتصر', answers: ['بنت الأكابر'] },
        { question: 'مسلسل مستوحى من رواية (الأوباش) لنجيب محفوظ', answers: ['بعد الفراق'] },
        { question: 'مسلسل خليجي كوميدي عن سائق وسلطة', answers: ['كسر الخواطر'] },
        { question: 'مسلسل بطولة محمد منير عن مغني شعبي في الصعيد', answers: ['مملكة الغجر'] },
        { question: 'مسلسل بطولة إياد نصار عن صراع في عالم الأعمال', answers: ['واحة الغروب'] },
        { question: 'مسلسل مصري درامي عن أيام الملك فاروق', answers: ['الملك فاروق'] },
        { question: 'مسلسل بطولة خالد النبوي عن طبيب نفسي', answers: ['عرفة'] },
        { question: 'مسلسل درامي عن الثورة الصناعية في مصر', answers: ['الآلات'] }
    ]
};

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `📺 فـعـالـيـة تـخـمـيـن الـمـسـلـسـل 📺\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: 'مسلسل',
    description: '📺 تخمين اسم المسلسل حسب الوصف (سهل/متوسط/صعب)',
    category: 'فعاليات',
    usage: '.مسلسل [سهل|متوسط|صعب]',
    example: '.مسلسل سهل',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const points = loadJSON(pointsPath);

            // استخراج مستوى الصعوبة
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const parts = body.trim().split(/\s+/);
            let inputLevel = (parts[1] || '').trim();

            const validLevels = ['سهل', 'متوسط', 'صعب'];
            if (!validLevels.includes(inputLevel)) {
                const lines = [
                    '📖 المستويات المتاحة:',
                    '',
                    '🟢 سهل - 50 نقطة',
                    '🟡 متوسط - 100 نقطة',
                    '🔴 صعب - 200 نقطة',
                    '',
                    '💡 استخدم: .مسلسل سهل'
                ];
                return sendMessage(sock, chatId, lines, msg);
            }

            const levelQuestions = series[inputLevel];
            const serie = levelQuestions[Math.floor(Math.random() * levelQuestions.length)];
            let finished = false;

            // إرسال السؤال
            const lines = [
                `📺 *خمن اسم المسلسل*`,
                ``,
                `❓ ${serie.question}`,
                `📊 المستوى: ${inputLevel}`,
                `⏳ الوقت: ${timeMap[inputLevel] / 1000} ثانية`,
                `💰 الجائزة: ${rewardMap[inputLevel]} نقطة`,
                ``,
                `📝 اكتب الإجابة في رسالة`
            ];

            await sendMessage(sock, chatId, lines, msg);

            const handler = async ({ messages }) => {
                if (finished) return;
                for (const m of messages) {
                    if (m.key.remoteJid !== chatId) continue;
                    const sender = m.key.participant || m.participant || m.key.remoteJid;
                    const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
                    if (!txt) continue;

                    if (serie.answers.some(a => a.toLowerCase() === txt.trim().toLowerCase())) {
                        finished = true;
                        clearTimeout(timeout);
                        sock.ev.off('messages.upsert', handler);

                        points[sender] = (points[sender] || 0) + rewardMap[inputLevel];
                        saveJSON(pointsPath, points);

                        const result = [
                            `👑 الفائز: @${sender.split('@')[0]}`,
                            ``,
                            `📺 المسلسل: ${serie.answers[0]}`,
                            `⭐ +${rewardMap[inputLevel]} نقطة`,
                            `💰 نقاطك: ${points[sender]}`,
                            ``,
                            `🎉 تهانينا! إجابة صحيحة!`
                        ];
                        await sendMessage(sock, chatId, result, m, [sender]);
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
                    points[jid] = Math.max(0, (points[jid] || 0) - penaltyMap[inputLevel]);
                    deductedCount++;
                }

                saveJSON(pointsPath, points);

                const penaltyMsg = [
                    `⏰ انتهى الوقت!`,
                    ``,
                    `📺 المسلسل الصحيح: ${serie.answers[0]}`,
                    ``,
                    `💔 تم خصم ${penaltyMap[inputLevel]} نقطة من ${deductedCount} مشارك${deductedCount > 1 ? 'ين' : ''}`,
                    ``,
                    `📌 حاول مرة أخرى مع .مسلسل`
                ];
                await sendMessage(sock, chatId, penaltyMsg, msg);
            }, timeMap[inputLevel]);

        } catch (error) {
            console.error('✗ خطأ في أمر مسلسل:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};