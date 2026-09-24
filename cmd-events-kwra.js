// كورة.js - فعالية أسئلة كروية (كرة القدم) - نسخة محسنة بدون خطوط
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

// ========== بنك الأسئلة الكروية ==========
const football = {
    سهل: [
        { question: 'منتخب فاز بكأس العالم 2018', answers: ['فرنسا'] },
        { question: 'أشهر نادي في إسبانيا وملعبه الكامب نو', answers: ['برشلونة'] },
        { question: 'نادي الملكي الإسباني', answers: ['ريال مدريد'] },
        { question: 'لاعب الأرجنتين الشهير، قائد منتخب الأرجنتين', answers: ['ميسي'] },
        { question: 'لاعب البرتغال صاحب الرقم 7 في النصر سابقاً', answers: ['رونالدو', 'كريستيانو'] },
        { question: 'البطولة الأهم للأندية الأوروبية', answers: ['دوري أبطال أوروبا', 'شامبيونزليغ'] },
        { question: 'منتخب الكناري والأساطير بيلية', answers: ['البرازيل'] },
        { question: 'أفضل حارس مرمى تاريخياً (ألمانيا)', answers: ['نوير'] },
        { question: 'نادي إنجليزي ملعبه أولد ترافورد', answers: ['مانشستر يونايتد'] },
        { question: 'نادي إنجليزي ملعبه الاتحاد', answers: ['مانشستر سيتي'] },
        { question: 'منتخب الأرجنتين كأس العالم 2022', answers: ['الأرجنتين'] },
        { question: 'نادي ميلان الإيطالي', answers: ['ميلان', 'ايه سي ميلان'] },
        { question: 'نادي إنتر ميلان الإيطالي', answers: ['إنتر ميلان', 'انتر'] },
        { question: 'لاعب مصري شهير في ليفربول', answers: ['محمد صلاح', 'صلاح'] },
        { question: 'منتخب إنجلترا يلقب بـ', answers: ['الأسود الثلاثة'] }
    ],
    متوسط: [
        { question: 'الهداف التاريخي لكأس العالم (ألماني)', answers: ['ميروسلاف كلوزه'] },
        { question: 'مدرب فاز بدوري أبطال أوروبا مع ريال مدريد 3 مرات متتالية', answers: ['زيدان'] },
        { question: 'نادي إيطالي يلقب بالعجوز', answers: ['يوفنتوس'] },
        { question: 'أغلى صفقة في التاريخ (البرازيلي)', answers: ['نيمار'] },
        { question: 'فريق فاز بسداسية الأبطال (6 ألقاب) في سنة', answers: ['برشلونة'] },
        { question: 'منتخب الفيلة (كوت ديفوار)', answers: ['كوت ديفوار', 'ساحل العاج'] },
        { question: 'حارس مرمى عرف بـ"العنكبوت" (أرجنتيني)', answers: ['مارادونا'] },
        { question: 'أكثر من فاز بجائزة الكرة الذهبية', answers: ['ميسي'] },
        { question: 'نادي ألماني ملعبه أليانز أرينا', answers: ['بايرن ميونخ'] },
        { question: 'دوري الدرجة الأولى الإنجليزي', answers: ['بريميرليغ'] },
        { question: 'لاعب فرنسي فاز بكأس العالم 2018', answers: ['مبابي'] },
        { question: 'نادي تشيلسي الإنجليزي', answers: ['تشيلسي'] },
        { question: 'منتخب ألمانيا يلقب بـ', answers: ['الماكينات'] },
        { question: 'لاعب برازيلي في ريال مدريد', answers: ['فينيسيوس'] },
        { question: 'نادي أتلتيكو مدريد', answers: ['أتلتيكو مدريد'] }
    ],
    صعب: [
        { question: 'أصغر هداف في تاريخ كأس العالم (لاعب برازيلي 1958)', answers: ['بيليه'] },
        { question: 'مدرب ألماني فاز بكأس العالم 2014', answers: ['يواخيم لوف'] },
        { question: 'نادي فرنسي فاز بدوري أبطال أوروبا 2020', answers: ['باريس سان جيرمان', 'بي إس جي'] },
        { question: 'لاعب مغربي حصل على الكرة الذهبية لأفضل لاعب في أفريقيا 2022', answers: ['أشرف حكيمي', 'حكيمي'] },
        { question: 'منتخب فاز ببطولة كأس العرب 2021', answers: ['الجزائر'] },
        { question: 'حارس مرمى عرف بقفازاته الذهبية (ألماني سابق)', answers: ['كان'] },
        { question: 'نادي هولندي ملعبه يوهان كرويف أرينا', answers: ['أياكس'] },
        { question: 'أكثر مباراة في تاريخ كأس العالم سجلت أهدافاً', answers: ['النمسا 7-5 سويسرا'] },
        { question: 'لاعب إنجليزي معتاد على التسجيل من ركلات ثابتة', answers: ['بيكهام'] },
        { question: 'دوري المحترفين السعودي يلقب بـ', answers: ['روشن'] },
        { question: 'منتخب إيطاليا كأس العالم 2006', answers: ['إيطاليا'] },
        { question: 'لاعب هولندي أسطوري في أياكس', answers: ['كريوف'] },
        { question: 'نادي بوروسيا دورتموند', answers: ['بوروسيا دورتموند'] },
        { question: 'مدرب مانشستر سيتي الحالي', answers: ['غوارديولا'] },
        { question: 'لاعب أوروغواياني أسطوري', answers: ['فرانشيسكولي'] }
    ]
};

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `⚽ فـعـالـيـة كـرة الـقـدم ⚽\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: ["كورة", "كوره"],
    description: '⚽ أسئلة كروية عن كرة القدم (سهل/متوسط/صعب)',
    category: 'فعاليات',
    usage: '.كورة [سهل|متوسط|صعب]',
    example: '.كورة سهل',

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
                    '💡 مثال: .كورة سهل'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            const levelQuestions = football[inputLevel];
            const q = levelQuestions[Math.floor(Math.random() * levelQuestions.length)];

            const points = loadJSON(pointsPath);
            const kingdomData = loadJSON(kingdomPath);

            // إرسال السؤال
            const lines = [
                `⚽ *السؤال:*`,
                `${q.question}`,
                ``,
                `⏳ الوقت: ${timeMap[inputLevel] / 1000} ثانية`,
                `💰 الجائزة: ${rewardMap[inputLevel]} نقطة`,
                `🏆 المستوى: ${inputLevel}`,
                ``,
                `📝 أجب بأسرع وقت!`
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

                    if (q.answers.some(a => a.toLowerCase() === txt.trim().toLowerCase())) {
                        finished = true;
                        clearTimeout(timeout);
                        sock.ev.off('messages.upsert', handler);

                        points[winner] = (points[winner] || 0) + rewardMap[inputLevel];
                        saveJSON(pointsPath, points);

                        const resultLines = [
                            `🎉 *إجابة صحيحة!*`,
                            ``,
                            `🏆 الفائز: @${winner.split('@')[0]}`,
                            `⚽ الإجابة: ${q.answers[0]}`,
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
                    `⚽ الإجابة الصحيحة: ${q.answers[0]}`,
                    ``,
                    `💔 تم خصم ${penaltyMap[inputLevel]} نقطة`,
                    ``,
                    `📌 حاول مرة أخرى مع .كورة`
                ];
                await sendMessage(sock, chatId, penaltyLines, msg);
            }, timeMap[inputLevel]);

        } catch (error) {
            console.error('✗ خطأ في أمر كورة:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};