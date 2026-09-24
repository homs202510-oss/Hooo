// رتب.js - لعبة ترتيب الحروف (نسخة مستقلة بدون مملكة)
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
const timeMap = { سهل: 30000, متوسط: 30000, صعب: 30000 };

// ========== الكلمات ==========
const words = {
    سهل: [
        'ناروتو', 'ساسكي', 'ايتاتشي', 'هيناتا', 'ساكرا', 'كاكاشي', 'جيرايا', 'اوروتشيمارو',
        'تسونادي', 'غارا', 'تيماري', 'كيبا', 'شيكامارو', 'تشوجي', 'هوكاغي', 'ميناتو',
        'كوشينا', 'هيروزن', 'كيسامي', 'زيتسو', 'توبي', 'ديدارا', 'هيدان',
        'بوروتو', 'هيماواري', 'سارادا', 'ميتسكي', 'شينوبي', 'مادارا', 'هاشيراما',
        'كوراما', 'جينتشوريكي', 'شينراي', 'نيكו', 'ريو', 'كين', 'ميرو', 'سينا',
        'رين', 'هيرو', 'كايو', 'يوكي', 'هارو', 'نوبو', 'ساتورو', 'دايكي',
        'ريكو', 'ماسامي', 'تاكاشي', 'هيروشي', 'كازوكي', 'راي', 'ايزو', 'كينجي'
    ],
    متوسط: [
        'ناروتو اوزوماكي', 'ساسكي أوتشيها', 'كاكاشي هاتاكي', 'جيرايا السحري', 'اوروتشيمارو الشرير',
        'هيناتا هيوغا', 'ساكرا هارونو', 'غارا الصحراوي', 'تسونادي الساندايمي', 'ميناتو ناميكازي',
        'كوشينا اوزوماكي', 'ايتاتشي أوتشيها', 'شيكامارو نارا', 'تشوجي أكيميتشي', 'كيبا اينوزوكا',
        'تيماري الصحراء', 'هوكاغي القرية', 'هيروزن المعلم', 'كيسامي هوشيجاكي',
        'زيتسو الاسود', 'توبي الغامض', 'ديدارا الفنان', 'هيدان الثعبان',
        'بوروتو اوزوماكي', 'هيماواري الصغير', 'سارادا أوتشيها', 'ميتسكي الصامت',
        'شينوبي الظل', 'مادارا العظيم', 'هاشيراما الحكيم', 'كوراما الثعلب',
        'جينتشوريكي القوي', 'شينراي السريع', 'ياماتو الحكيم', 'توبيراما القوي'
    ],
    صعب: [
        'ناروتو اوزوماكي هوكاغي القرية', 'ساسكي أوتشيها المجنون بالانتقام', 'كاكاشي هاتاكي صاحب الشارينغان',
        'جيرايا السحري المعلم العظيم', 'اوروتشيمارو الشرير الباحث عن الخلود', 'هيناتا هيوغا أميرة الهيوجا',
        'ساكرا هارونو الطبيبة الماهرة', 'غارا الصحراوي حامل شوكاكو', 'تسونادي الساندايمي الهوكاغي الخامس',
        'ميناتو ناميكازي البرق الاصفر', 'كوشينا اوزوماكي والدة ناروتو', 'ايتاتشي أوتشيها مجزرة العشيرة',
        'شيكامارو نارا العبقري الكسول', 'تشوجي أكيميتشي آكل اللحوم', 'كيبا اينوزوكا صديق الكلاب',
        'تيماري الصحراء اخت غارا', 'هوكاغي القرية المخضرم', 'هيروزن المعلم الحكيم',
        'كيسامي هوشيجاكي صياد الذيل', 'زيتسو الاسود نصف الابيض', 'توبي الغامض صاحب القناع',
        'ديدارا الفنان صاحب الطين', 'هيدان الثعبان سيد الافاعي', 'بوروتو اوزوماكي ابن ناروتو',
        'هيماواري الصغير حفيد الهوكاغي', 'سارادا أوتشيها بنت ساسكي', 'ميتسكي الصامت صاحب العين',
        'شينوبي الظل سيد التخفي', 'مادارا العظيم صاحب الرينيجان', 'هاشيراما الحكيم مؤسس القرية',
        'كوراما الثعلب صاحب التسعة ذيول', 'جينتشوريكي القوي حامل الوحش', 'شينراي السريع البرق الاسود',
        'ياماتو الحكيم مرشد الابطال', 'توبيراما القوي ثاني الهوكاغي'
    ]
};

// ========== خلط الحروف ==========
function shuffleWord(word) {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join(' ');
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🔠 لـعـبـة تـرتـيـب الـحـروف 🔠\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        msg += `${line}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;
    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

module.exports = {
    command: 'رتب',
    description: '🎮 لعبة ترتيب الحروف حسب المستوى [سهل|متوسط|صعب]',
    usage: '.رتب [سهل|متوسط|صعب]',
    category: 'فعاليات',
    example: '.رتب سهل',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
            const points = loadJSON(pointsPath);

            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const parts = body.trim().split(/\s+/);
            const inputLevel = (parts[1] || 'سهل').trim();

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
                    '💡 مثال: .رتب سهل'
                ];
                await sendMessage(sock, chatId, lines, msg, [sender]);
                return;
            }

            const levelWords = words[inputLevel];
            const chosen = levelWords[Math.floor(Math.random() * levelWords.length)];
            const answer = chosen.trim().toLowerCase();
            const shuffled = shuffleWord(chosen);

            // إرسال السؤال
            const lines = [
                `📝 *رتب الحروف التالية:*`,
                ``,
                `🎯 ${shuffled}`,
                ``,
                `⏳ الوقت: 30 ثانية`,
                `💰 الجائزة: ${rewardMap[inputLevel]} نقطة`,
                `💔 الخسارة: -${penaltyMap[inputLevel]} نقطة`,
                `🏆 المستوى: ${inputLevel}`,
                ``,
                `📝 اكتب الكلمة الصحيحة`
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

                    if (txt.trim().toLowerCase() === answer) {
                        finished = true;
                        clearTimeout(timeout);
                        sock.ev.off('messages.upsert', handler);

                        points[winner] = (points[winner] || 0) + rewardMap[inputLevel];
                        saveJSON(pointsPath, points);

                        const resultLines = [
                            `🎉 *إجابة صحيحة!*`,
                            ``,
                            `🏆 الفائز: @${winner.split('@')[0]}`,
                            `📖 الكلمة: *${chosen}*`,
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
                    `📖 الكلمة الصحيحة: *${chosen}*`,
                    ``,
                    `💔 تم خصم ${penaltyMap[inputLevel]} نقطة`,
                    ``,
                    `📌 حاول مرة أخرى مع .رتب`
                ];
                await sendMessage(sock, chatId, penaltyLines, msg);
            }, timeMap[inputLevel]);

        } catch (error) {
            console.error('✗ خطأ في أمر رتب:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ حدث خطأ أثناء تنفيذ الأمر.',
                '📌 حاول مرة أخرى لاحقاً.'
            ], msg);
        }
    }
};