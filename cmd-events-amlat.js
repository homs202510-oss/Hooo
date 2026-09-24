// عملات.js - فعالية تخمين اسم العملة (نسخة مستقلة بدون مملكة)
const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');

if (!fs.existsSync(__dirname)) fs.mkdirSync(__dirname, { recursive: true });
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));

function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file)); } catch { return {}; } }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

const rewardMap = { سهل: 50, متوسط: 100, صعب: 200 };
const penaltyMap = { سهل: 50, متوسط: 100, صعب: 200 };
const timeMap = { سهل: 10000, متوسط: 15000, صعب: 20000 };

// ========== بنك العملات (إجابات مختصرة) ==========
const currencies = {
    سهل: [
        { question: 'عملة مصر', answers: ['جنيه'] },
        { question: 'عملة السعودية', answers: ['ريال'] },
        { question: 'عملة الكويت', answers: ['دينار'] },
        { question: 'عملة الإمارات', answers: ['درهم'] },
        { question: 'عملة قطر', answers: ['ريال'] },
        { question: 'عملة البحرين', answers: ['دينار'] },
        { question: 'عملة عمان', answers: ['ريال'] },
        { question: 'عملة الأردن', answers: ['دينار'] },
        { question: 'عملة المغرب', answers: ['درهم'] },
        { question: 'عملة تونس', answers: ['دينار'] },
        { question: 'عملة لبنان', answers: ['ليرة'] },
        { question: 'عملة فلسطين', answers: ['شيكل'] },
        { question: 'عملة سوريا', answers: ['ليرة'] },
        { question: 'عملة اليمن', answers: ['ريال'] },
        { question: 'عملة الصومال', answers: ['شلن'] }
    ],
    متوسط: [
        { question: 'عملة الولايات المتحدة الأمريكية', answers: ['دولار'] },
        { question: 'عملة دول الاتحاد الأوروبي', answers: ['يورو'] },
        { question: 'عملة بريطانيا', answers: ['جنيه'] },
        { question: 'عملة اليابان', answers: ['ين'] },
        { question: 'عملة الصين', answers: ['يوان'] },
        { question: 'عملة الهند', answers: ['روبية'] },
        { question: 'عملة تركيا', answers: ['ليرة'] },
        { question: 'عملة روسيا', answers: ['روبل'] },
        { question: 'عملة سويسرا', answers: ['فرنك'] },
        { question: 'عملة كندا', answers: ['دولار'] },
        { question: 'عملة أستراليا', answers: ['دولار'] },
        { question: 'عملة البرازيل', answers: ['ريال'] },
        { question: 'عملة المكسيك', answers: ['بيزو'] },
        { question: 'عملة جنوب أفريقيا', answers: ['راند'] },
        { question: 'عملة كوريا الجنوبية', answers: ['وون'] }
    ],
    صعب: [
        { question: 'عملة إيران', answers: ['ريال', 'تومان'] },
        { question: 'عملة العراق', answers: ['دينار'] },
        { question: 'عملة ليبيا', answers: ['دينار'] },
        { question: 'عملة السودان', answers: ['جنيه'] },
        { question: 'عملة الجزائر', answers: ['دينار'] },
        { question: 'عملة باكستان', answers: ['روبية'] },
        { question: 'عملة أفغانستان', answers: ['أفغاني'] },
        { question: 'عملة تايلاند', answers: ['بات'] },
        { question: 'عملة فيتنام', answers: ['دونغ'] },
        { question: 'عملة نيجيريا', answers: ['نايرا'] },
        { question: 'عملة سنغافورة', answers: ['دولار'] },
        { question: 'عملة ماليزيا', answers: ['رينغيت'] },
        { question: 'عملة إندونيسيا', answers: ['روبية'] },
        { question: 'عملة الفلبين', answers: ['بيزو'] }
    ]
};

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }
    
    let msg = `💰 فـعـالـيـة الـعـمـلات 💰\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: ['عملات', 'عملة'],
    description: '💰 تخمين اسم العملة (سهل/متوسط/صعب)',
    category: 'فعاليات',
    usage: '.عملات [سهل|متوسط|صعب]',
    example: '.عملة سهل',

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
                    '💡 مثال: .عملات سهل'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            const levelQuestions = currencies[inputLevel];
            const currency = levelQuestions[Math.floor(Math.random() * levelQuestions.length)];

            // إرسال السؤال
            const lines = [
                `💰 *خمن العملة*`,
                ``,
                `❓ ${currency.question}`,
                ``,
                `⏳ الوقت: ${timeMap[inputLevel] / 1000} ثانية`,
                `💰 الجائزة: ${rewardMap[inputLevel]} نقطة`,
                `💎 المستوى: ${inputLevel}`,
                ``,
                `📝 اكتب اسم العملة`
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

                    if (currency.answers.some(a => a.toLowerCase() === txt.trim().toLowerCase())) {
                        finished = true;
                        clearTimeout(timeout);
                        sock.ev.off('messages.upsert', handler);

                        points[winner] = (points[winner] || 0) + rewardMap[inputLevel];
                        saveJSON(pointsPath, points);

                        const resultLines = [
                            `🎉 *إجابة صحيحة!*`,
                            ``,
                            `🏆 الفائز: @${winner.split('@')[0]}`,
                            `💰 العملة: *${currency.answers[0]}*`,
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
                    if (jid !== sock.user.id) {
                        points[jid] = Math.max(0, (points[jid] || 0) - penaltyMap[inputLevel]);
                        deductedCount++;
                    }
                }

                saveJSON(pointsPath, points);

                const penaltyLines = [
                    `⏰ *انتهى الوقت!*`,
                    ``,
                    `💰 العملة الصحيحة: *${currency.answers[0]}*`,
                    ``,
                    `💔 تم خصم ${penaltyMap[inputLevel]} نقطة`,
                    ``,
                    `📌 حاول مرة أخرى مع .عملات`
                ];
                await sendMessage(sock, chatId, penaltyLines, msg);
            }, timeMap[inputLevel]);

        } catch (error) {
            console.error('✗ خطأ في أمر عملات:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};