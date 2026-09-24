// تفكيك.js - لعبة تفكيك الكلمة إلى حروف (الكل يشارك)

const fs = require('fs');
const path = require('path');

const pointsPath = path.join(__dirname, 'db-points.json');
const ranksPath = path.join(__dirname, 'db-ranks.json');

// ========== التأكد من وجود الملفات ==========
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));
if (!fs.existsSync(ranksPath)) fs.writeFileSync(ranksPath, JSON.stringify({}, null, 2));

// ========== دوال مساعدة ==========
function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } 
    catch { return {}; }
}

function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getLevel(points) {
    if (points >= 1000000000) return '👑 DEVELOPER';
    if (points >= 100000000) return '🌀 KING OF POINTS';
    if (points >= 10000000) return '💀 BIG BOSS';
    if (points >= 1000000) return '🔥🔥 WTF';
    if (points >= 100000) return '🔪🩸 KILLER';
    if (points >= 10000) return '🦁 LEGEND';
    if (points >= 1000) return '💎 PRO';
    if (points >= 500) return '🔥 advanced';
    if (points >= 200) return '🌱 junior';
    return '🙂 beginner';
}

function spaceify(word) {
    return word.split('').join(' ');
}

function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    num = Math.floor(num);
    if (num >= 1e15) return '∞';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + ' تريليون';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + ' مليار';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + ' مليون';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + ' ألف';
    return num.toString();
}

// ========== دالة الإرسال بتنسيق موحد ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `📖 تـفـكـيـك الـكـلـمـة 📖\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴 ❤️`;
    
    await sock.sendMessage(chatId, { 
        text: msg, 
        mentions 
    }, { 
        quoted: quoted 
    });
}

// ========== مستويات اللعبة ==========
const rewardMap = { سهل: 50, متوسط: 100, صعب: 200 };
const penaltyMap = { سهل: 50, متوسط: 100, صعب: 200 };
const timeMap = { سهل: 15000, متوسط: 20000, صعب: 30000 };

// ========== كلمات المستويات ==========
const words = {
    سهل: [
        'ناروتو', 'ساسكي', 'ايتاتشي', 'هيناتا', 'ساكرا', 'كاكاشي', 'جيرايا', 'اوروتشيمارو',
        'تسونادي', 'غارا', 'تيماري', 'كيبا', 'شيكامارو', 'تشوجي', 'هوكاغي', 'ميناتو',
        'كوشينا', 'هيروزن', 'كيسامي', 'زيتسو', 'توبي', 'ديدارا', 'هيدان', 'كاجومي',
        'يوهان', 'ليلاي', 'سابو', 'آيس', 'بوروتو', 'هيماواري', 'سارادا', 'ميتسكي',
        'شينوبي', 'سايكو', 'رينيه', 'ناجيسا', 'يوجيتو', 'فوجيكو', 'تاكاشي', 'ياماتو',
        'كوراما', 'مادارا', 'هاشيراما', 'توبيراما', 'جينتشوريكي', 'شينراي', 'أوسوماتسو',
        'كاراماتسو', 'شوغو', 'تاكا', 'نيكو', 'ريو', 'كين', 'ميرو', 'سينا', 'رين',
        'هيرو', 'كايو', 'تاتسو', 'يوكي', 'هارو', 'نوبو', 'كوجي', 'ساتورو', 'دايكي',
        'ريكو', 'ماسامي', 'تاكاشي', 'هيروشي', 'كازوكي', 'راي', 'لوفي', 'زورو', 'سانجي',
        'نامي', 'تشوبر', 'روبن', 'فرانكي', 'بروك', 'شانكس', 'ميهوك', 'كروكودايل'
    ],
    متوسط: [
        'ناروتو اوزوماكي', 'ساسكي أوتشيها', 'كاكاشي هاتاكي', 'جيرايا السحري', 'اوروتشيمارو الشرير',
        'هيناتا هيوغا', 'ساكرا هارونو', 'غارا الصحراوي', 'تسونادي الساندايمي', 'ميناتو ناميكازي',
        'كوشينا اوزوماكي', 'ايتاتشي أوتشيها', 'شيكامارو نارا', 'تشوجي أكيميتشي', 'كيبا اينوزوكا',
        'تيماري الصحراء', 'اوروشيمارو الاسطوري', 'هوكاغي القرية', 'هيروزن المعلم', 'كيسامي هوشيجاكي',
        'زيتسو الاسود', 'توبي الغامض', 'ديدارا الفنان', 'هيدان الثعبان', 'كاجومي الثلج', 'يوهان الطبيب',
        'ليلاي الساحرة', 'سابو الثوري', 'آيس النار', 'بوروتو اوزوماكي', 'هيماواري الصغير', 'سارادا أوتشيها',
        'ميتسكي الصامت', 'شينوبي الظل', 'سايكو الذكي', 'رينيه الغامضة', 'ناجيسا الهادئة', 'يوجيتو السريع',
        'فوجيكو المخلصة', 'تاكاشي الشجاع', 'ياماتو الحكيم', 'كوراما الثعلب', 'مادارا العظيم', 'هاشيراما الحكيم',
        'توبيراما القوي', 'هيروزن الحكيم', 'جينتشوريكي القوي', 'شينراي السريع', 'أوسوماتسو المزعج',
        'كاراماتسو العنيد', 'شوغو الطموح', 'تاكا الشرس', 'نيكو الصغير', 'ريو الهادئ', 'كين السريع'
    ],
    صعب: [
        'ناروتو اوزوماكي هوكاغي القرية', 'ساسكي أوتشيها المجنون بالانتقام', 'كاكاشي هاتاكي صاحب الشارينغان',
        'جيرايا السحري المعلم العظيم', 'اوروتشيمارو الشرير الباحث عن الخلود', 'هيناتا هيوغا أميرة الهيوجا',
        'ساكرا هارونو الطبيبة الماهرة', 'غارا الصحراوي حامل شوكاكو', 'تسونادي الساندايمي الهوكاغي الخامس',
        'ميناتو ناميكازي البرق الاصفر', 'كوشينا اوزوماكي والدة ناروتو', 'ايتاتشي أوتشيها مجزرة العشيرة',
        'شيكامارو نارا العبقري الكسول', 'تشوجي أكيميتشي آكل اللحوم', 'كيبا اينوزوكا صديق الكلاب',
        'تيماري الصحراء اخت غارا', 'اوروشيمارو الاسطوري الثعبان الابيض', 'هوكاغي القرية المخضرم',
        'هيروزن المعلم الحكيم', 'كيسامي هوشيجاكي صياد الذيل', 'زيتسو الاسود نصف الابيض',
        'توبي الغامض صاحب القناع', 'ديدارا الفنان صاحب الطين', 'هيدان الثعبان سيد الافاعي',
        'كاجومي الثلج سيد الجليد', 'يوهان الطبيب المجنون', 'ليلاي الساحرة صاحبة التعويذات',
        'سابو الثوري ضد النظام', 'آيس النار سيد اللهب', 'بوروتو اوزوماكي ابن ناروتو',
        'هيماواري الصغير حفيد الهوكاغي', 'سارادا أوتشيها بنت ساسكي', 'ميتسكي الصامت صاحب العين',
        'شينوبي الظل سيد التخفي', 'سايكو الذكي مخطط المعارك', 'رينيه الغامضة صاحبة الاسرار',
        'ناجيسا الهادئة حارسة السلام', 'يوجيتو السريع البرق الاسود', 'فوجيكو المخلصة حارسة القرية',
        'تاكاشي الشجاع بطل المعارك', 'ياماتو الحكيم مرشد الابطال'
    ]
};

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['تفكيك', 'فكك'],
    description: '📖 فك الكلمة إلى حروف مفصولة بمسافة (الكل يشارك)',
    category: 'فعاليات',
    usage: '.تفكيك [سهل|متوسط|صعب]',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
            const senderNum = sender.split('@')[0];

            // ===== قراءة النص =====
            const fullText = msg.message?.conversation || 
                           msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/).slice(1);
            const inputLevel = (args[0] || 'سهل').trim();

            // ===== التحقق من المستوى =====
            const validLevels = ['سهل', 'متوسط', 'صعب'];
            if (!validLevels.includes(inputLevel)) {
                await sendMessage(sock, chatId, [
                    '❌ *مستوى غير صحيح*',
                    '',
                    '📌 المستويات المتاحة:',
                    '   🟢 سهل',
                    '   🟡 متوسط',
                    '   🔴 صعب',
                    '',
                    '📝 مثال: `.تفكيك سهل`'
                ], msg);
                return;
            }

            // ===== اختيار كلمة عشوائية =====
            const levelWords = words[inputLevel];
            if (!levelWords || levelWords.length === 0) {
                await sendMessage(sock, chatId, [
                    '❌ *لا توجد كلمات في هذا المستوى*',
                    '',
                    '📌 اختر مستوى آخر'
                ], msg);
                return;
            }

            const word = levelWords[Math.floor(Math.random() * levelWords.length)];
            const correctAnswer = spaceify(word); // الكلمة مفككة بمسافات (مثل "ل و ف ي")

            // ===== إرسال التحدي =====
            await sendMessage(sock, chatId, [
                `📖 *فك الكلمة التالية:*`,
                '',
                `📝 *${word}*`,
                '',
                `⏳ *الوقت:* ${timeMap[inputLevel] / 1000} ثواني`,
                `💰 *المكافأة:* +${rewardMap[inputLevel]} نقطة`,
                `⚠️ *العقاب:* -${penaltyMap[inputLevel]} نقطة (للمنشئ فقط)`,
                `👤 *المنشئ:* @${senderNum}`,
                '',
                '✍️ أرسل الكلمة مفككة (حروف مفصولة بمسافة)',
                '📌 مثال: `ل و ف ي`',
                '✅ الجميع يمكنه المشاركة!'
            ], msg, [sender]);

            // ===== تحميل البيانات =====
            const points = loadJSON(pointsPath);
            const ranks = loadJSON(ranksPath);

            let ended = false;
            let timer = null;

            // ===== معالج الردود (الكل يشارك) =====
            const handler = async ({ messages }) => {
                for (const m of messages) {
                    if (ended) return;
                    if (m.key.remoteJid !== chatId) continue;
                    if (m.key.fromMe) continue;

                    const txt = m.message?.conversation || 
                               m.message?.extendedTextMessage?.text || '';
                    if (!txt) continue;

                    const answerer = m.key.participant || m.participant || m.key.remoteJid;

                    // ===== مقارنة الإجابة (بدون إزالة المسافات الداخلية) =====
                    // نأخذ النص ونزيل المسافات الزائدة من البداية والنهاية فقط
                    const userAnswer = txt.trim();
                    
                    // نقارن مع correctAnswer مباشرة (يجب أن تكون متطابقة تماماً مع المسافات)
                    if (userAnswer === correctAnswer) {
                        ended = true;
                        clearTimeout(timer);
                        sock.ev.off('messages.upsert', handler);

                        // تحديث النقاط
                        points[answerer] = (points[answerer] || 0) + rewardMap[inputLevel];
                        ranks[answerer] = (ranks[answerer] || 0) + 1;
                        saveJSON(pointsPath, points);
                        saveJSON(ranksPath, ranks);

                        await sendMessage(sock, chatId, [
                            '🎉 *إجابة صحيحة!* 🎉',
                            '',
                            `🏆 *الفائز:* @${answerer.split('@')[0]}`,
                            `📖 *الكلمة:* ${word}`,
                            `🔓 *الحل:* ${correctAnswer}`,
                            `📊 *المستوى:* ${inputLevel}`,
                            `💰 *المكافأة:* +${rewardMap[inputLevel]} نقطة`,
                            `📈 *رصيدك:* ${formatNumber(points[answerer] || 0)} نقطة`,
                            `🏅 *الرتبة:* ${getLevel(points[answerer] || 0)}`,
                            `🎖️ *عدد التخمينات الصحيحة:* ${ranks[answerer] || 0}`
                        ], m, [answerer]);
                        return;
                    }
                }
            };

            sock.ev.on('messages.upsert', handler);

            // ===== المهلة =====
            timer = setTimeout(async () => {
                if (ended) return;
                ended = true;
                sock.ev.off('messages.upsert', handler);

                // خصم نقاط من المنشئ فقط (وليس من الكل)
                points[sender] = (points[sender] || 0) - penaltyMap[inputLevel];
                saveJSON(pointsPath, points);

                await sendMessage(sock, chatId, [
                    '⏰ *انتهى الوقت!*',
                    '',
                    `❌ *الكلمة:* ${word}`,
                    `🔓 *الحل الصحيح:* ${correctAnswer}`,
                    `📊 *المستوى:* ${inputLevel}`,
                    `➖ *تم خصم:* ${penaltyMap[inputLevel]} نقطة من المنشئ`,
                    `📈 *رصيد المنشئ:* ${formatNumber(points[sender] || 0)} نقطة`,
                    `🏅 *رتبة المنشئ:* ${getLevel(points[sender] || 0)}`,
                    `👤 *المنشئ:* @${senderNum}`
                ], null, [sender]);

            }, timeMap[inputLevel]);

        } catch (error) {
            console.error('❌ خطأ في أمر تفكيك:', error);
            await sendMessage(sock, msg.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], msg);
        }
    }
};