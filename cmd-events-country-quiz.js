// دولة.js - فعالية تخمين اسم الدولة (نسخة محسنة بدون خطوط)
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

// ========== الدول ==========
const countries = {
    سهل: [
        { question: 'دولة الأهرامات وأبو الهول', answers: ['مصر'] },
        { question: 'دولة البرجين (برج خليفة وبرج العرب)', answers: ['الإمارات', 'دبي'] },
        { question: 'الدولة التي تضم المسجد الحرام والكعبة', answers: ['السعودية'] },
        { question: 'دولة المليون شهيد', answers: ['الجزائر'] },
        { question: 'دولة الأرز والمقاومة', answers: ['لبنان'] },
        { question: 'دولة الأندلس السابقة', answers: ['إسبانيا'] },
        { question: 'دولة البيتزا والكولوسيوم', answers: ['إيطاليا'] },
        { question: 'دولة العطور والبرج الحديدي', answers: ['فرنسا'] },
        { question: 'دولة الشاي والوقت', answers: ['بريطانيا'] },
        { question: 'دولة الساموراي والتكنولوجيا', answers: ['اليابان'] },
        { question: 'دولة الكانغارو والكوالا', answers: ['أستراليا'] },
        { question: 'دولة القيقب والتزلج', answers: ['كندا'] },
        { question: 'دولة التيوليب والطواحين', answers: ['هولندا'] },
        { question: 'دولة الساعات والشوكولاتة', answers: ['سويسرا'] },
        { question: 'دولة الفقراء والغابة المطيرة', answers: ['البرازيل'] }
    ],
    متوسط: [
        { question: 'أكبر دولة في أفريقيا من حيث المساحة', answers: ['الجزائر'] },
        { question: 'دولة تقع في القرن الأفريقي، عاصمتها أديس أبابا', answers: ['إثيوبيا'] },
        { question: 'دولة أوروبية معروفة بالساعات والشوكولاتة والبنوك', answers: ['سويسرا'] },
        { question: 'دولة تتكون من 50 ولاية وعلمها من خطوط ونجوم', answers: ['أمريكا', 'الولايات المتحدة'] },
        { question: 'دولة أمريكا اللاتينية المشهورة بالتانغو واللحم', answers: ['الأرجنتين'] },
        { question: 'دولة أسكيا موسى وتمبكتو', answers: ['مالي'] },
        { question: 'دولة الفيلة البيضاء والملكة سيكو', answers: ['تايلاند'] },
        { question: 'دولة تمتد على قارتين (آسيا وأوروبا)', answers: ['تركيا', 'روسيا'] },
        { question: 'دولة الجزر الثلاثة (قبرص، مالطا، أيسلندا)', answers: ['قبرص'] },
        { question: 'دولة تشتهر بقناة السويس والبترول', answers: ['مصر'] },
        { question: 'دولة الكيوي والماوري', answers: ['نيوزيلندا'] },
        { question: 'دولة الفيورد والفايكنج', answers: ['النرويج'] },
        { question: 'دولة التوليب والجبن', answers: ['هولندا'] },
        { question: 'دولة الأهرامات والآثار الفرعونية', answers: ['مصر'] },
        { question: 'دولة الأرجنتين والتانغو', answers: ['الأرجنتين'] }
    ],
    صعب: [
        { question: 'دولة غير ساحلية في أمريكا الجنوبية، عاصمتها لاباز وسوكري', answers: ['بوليفيا'] },
        { question: 'دولة في المحيط الهادئ معروفة بتماثيل مواي الحجرية', answers: ['تشيلي', 'جزيرة الفصح'] },
        { question: 'دولة أفريقية ناطقة بالبرتغالية، عاصمتها مابوتو', answers: ['موزمبيق'] },
        { question: 'أصغر دولة في العالم من حيث المساحة والسكان', answers: ['الفاتيكان'] },
        { question: 'دولة تقع في جبال القوقاز، عاصمتها تبليسي', answers: ['جورجيا'] },
        { question: 'دولة تعرف بأرض الألف تل', answers: ['أذربيجان'] },
        { question: 'دولة اسمها يعني "السماء الصافية" باللاتينية', answers: ['كازاخستان'] },
        { question: 'دولة في شرق آسيا عاصمتها أولان باتور', answers: ['منغوليا'] },
        { question: 'دولة أوروبية عاصمتها فادوز وتشتهر بطوابع البريد', answers: ['ليختنشتاين'] },
        { question: 'دولة جزيرية في المحيط الهندي، عاصمتها فيكتوريا', answers: ['سيشل'] },
        { question: 'دولة أفريقية صغيرة محاطة بالكامل بجنوب أفريقيا', answers: ['ليسوتو'] },
        { question: 'دولة في آسيا الوسطى عاصمتها طشقند', answers: ['أوزبكستان'] },
        { question: 'دولة جبلية في جبال الهيمالايا عاصمتها كاتماندو', answers: ['نيبال'] },
        { question: 'دولة في منطقة البلقان عاصمتها تيرانا', answers: ['ألبانيا'] },
        { question: 'دولة جزرية في المحيط الهادئ عاصمتها نوكو ألوفا', answers: ['تونغا'] }
    ]
};

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🌍 فـعـالـيـة الـدول 🌍\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: ['دولة', 'دول'],
    description: '🌍 تخمين اسم الدولة (سهل/متوسط/صعب)',
    category: 'فعاليات',
    usage: '.دولة [سهل|متوسط|صعب]',
    example: '.دولة سهل',

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
                    '💡 مثال: .دولة سهل'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            const levelQuestions = countries[inputLevel];
            const country = levelQuestions[Math.floor(Math.random() * levelQuestions.length)];

            // إرسال السؤال
            const lines = [
                `🌍 *خمن الدولة*`,
                ``,
                `❓ ${country.question}`,
                ``,
                `⏳ الوقت: ${timeMap[inputLevel] / 1000} ثانية`,
                `💰 الجائزة: ${rewardMap[inputLevel]} نقطة`,
                `💔 الخسارة: -${penaltyMap[inputLevel]} نقطة`,
                `🌏 المستوى: ${inputLevel}`,
                ``,
                `📝 اكتب اسم الدولة`
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

                    if (country.answers.some(a => a.toLowerCase() === txt.trim().toLowerCase())) {
                        finished = true;
                        clearTimeout(timeout);
                        sock.ev.off('messages.upsert', handler);

                        points[winner] = (points[winner] || 0) + rewardMap[inputLevel];
                        saveJSON(pointsPath, points);

                        const resultLines = [
                            `🎉 *إجابة صحيحة!*`,
                            ``,
                            `🏆 الفائز: @${winner.split('@')[0]}`,
                            `🗺️ الدولة: *${country.answers[0]}*`,
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
                    `🌍 الدولة الصحيحة: *${country.answers[0]}*`,
                    ``,
                    `💔 تم خصم ${penaltyMap[inputLevel]} نقطة`,
                    ``,
                    `📌 حاول مرة أخرى مع .دولة`
                ];
                await sendMessage(sock, chatId, penaltyLines, msg);
            }, timeMap[inputLevel]);

        } catch (error) {
            console.error('✗ خطأ في أمر دولة:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};