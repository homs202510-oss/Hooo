// انمي.js - لعبة أسئلة أنمي متطورة مع نقاط وتصنيف ومكافآت سلسلة (نسخة محسنة)

const fs = require('fs');
const path = require('path');

// ============================================================
// 📁 إعدادات الملفات
// ============================================================
const pointsPath = path.join(__dirname, 'db-points.json');
const ranksPath = path.join(__dirname, 'db-ranks.json');
const streakPath = path.join(__dirname, 'db-streak.json');

if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, '{}');
if (!fs.existsSync(ranksPath)) fs.writeFileSync(ranksPath, '{}');
if (!fs.existsSync(streakPath)) fs.writeFileSync(streakPath, '{}');

// ============================================================
// 📊 دوال التعامل مع الملفات
// ============================================================
function loadJSON(file, fallback = {}) {
    try {
        if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
        return JSON.parse(fs.readFileSync(file));
    } catch {
        return fallback;
    }
}

function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ============================================================
// 🏆 نظام التصنيف (رتب)
// ============================================================
function getLevel(points) {
    if (points >= 1000000000) return '👑 إمبراطور الأنمي';
    if (points >= 100000000) return '🌀 ملك الأنمي';
    if (points >= 10000000) return '💀 هوكاغي الظل';
    if (points >= 1000000) return '🔥🔥 سينين الأسطوري';
    if (points >= 100000) return '🔪🩸 قاتل الأكاتسوكي';
    if (points >= 10000) return '🦁 سيد الشارينغان';
    if (points >= 1000) return '💎 نينجا محترف';
    if (points >= 500) return '🔥 تشونين';
    if (points >= 200) return '🌱 جينين';
    if (points < -10) return '🪫 نينجا راسب';
    return '🌱 جينين';
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

// ============================================================
// ⚙️ إعدادات المستويات
// ============================================================
const settings = {
    سهل: { reward: 50, penalty: 30, time: 15000 },
    متوسط: { reward: 100, penalty: 60, time: 20000 },
    صعب: { reward: 200, penalty: 100, time: 30000 }
};

// مكافآت السلسلة المتتالية
const streakBonus = {
    3: 10,
    5: 25,
    10: 50,
    20: 100,
    30: 200,
    50: 500
};

// ============================================================
// 📚 قاعدة الأسئلة (أنمي فقط - 150+ سؤال)
// ============================================================
const questions = {
    سهل: [
        { q: 'من هو بطل أنمي ناروتو؟', a: 'ناروتو' },
        { q: 'من صاحب قبعة القش؟', a: 'لوفي' },
        { q: 'من هو السايان الأشهر؟', a: 'غوكو' },
        { q: 'أخت تانجيرو اسمها ايه؟', a: 'نيزوكو' },
        { q: 'من معلم ناروتو؟', a: 'كاكاشي' },
        { q: 'مين صاحب الشارينغان؟', a: 'ساسكي' },
        { q: 'أنمي فيه قراصنة؟', a: 'ون بيس' },
        { q: 'مين قائد فريق 7؟', a: 'كاكاشي' },
        { q: 'مين صاحب الذيل التساعي؟', a: 'كوراما' },
        { q: 'مين أقوى سياف في ون بيس؟', a: 'زورو' },
        { q: 'مين بطل دراغون بول؟', a: 'غوكو' },
        { q: 'مين صديق لوفي؟', a: 'زورو' },
        { q: 'مين عنده شعر أصفر؟', a: 'ناروتو' },
        { q: 'مين أكل فاكهة المطاط؟', a: 'لوفي' },
        { q: 'مين بطل هجوم العمالقة؟', a: 'ايرين' },
        { q: 'مين صاحب الديث نوت؟', a: 'لايت' },
        { q: 'مين عنده عين واحدة؟', a: 'كاكاشي' },
        { q: 'مين بيستخدم 3 سيوف؟', a: 'زورو' },
        { q: 'مين أخو نيزوكو؟', a: 'تانجيرو' },
        { q: 'مين أم ناروتو؟', a: 'كوشينا' },
        { q: 'مين خصم غوكو؟', a: 'فيجيتا' },
        { q: 'مين عنده درع في AOT؟', a: 'راينر' },
        { q: 'مين صاحب القط هابي؟', a: 'ناتسو' },
        { q: 'مين بطل بلاك كلوفر؟', a: 'استا' },
        { q: 'مين عنده كتاب سحري؟', a: 'استا' },
        { q: 'مين أقوى سياف في بليتش؟', a: 'ايزن' },
        { q: 'مين قاتل العملاق؟', a: 'ايرين' },
        { q: 'مين صديق غوكو المقرب؟', a: 'كرلين' },
        { q: 'مين عنده تشيدوري؟', a: 'ساسكي' },
        { q: 'مين قاتل الأكاتسوكي؟', a: 'ناروتو' },
        { q: 'مين عنده قدرة التوقف الزمني؟', a: 'جوتارو' },
        { q: 'مين صاحب الجيتار في بيك؟', a: 'بيك' },
        { q: 'مين عنده شعر وردي؟', a: 'ساكرا' },
        { q: 'مين عنده عين أرنبية؟', a: 'هيناتا' },
        { q: 'مين عنده نادي السحر؟', a: 'ناتسو' },
        { q: 'مين عنده سيف طويل؟', a: 'زورو' },
        { q: 'مين عنده قبعة سوداء؟', a: 'لوفي' },
        { q: 'مين عنده جلباب أحمر؟', a: 'ناروتو' },
        { q: 'مين عنده نظارة شمسية؟', a: 'كاكاشي' },
        { q: 'مين عنده شعر أزرق؟', a: 'نيزوكو' },
    ],
    متوسط: [
        { q: 'من هو قائد الأكاتسوكي؟', a: 'بين' },
        { q: 'من هو ملك القراصنة؟', a: 'غول دي روجر' },
        { q: 'مين معلم ساسكي؟', a: 'اوروتشيمارو' },
        { q: 'مين قتل جيرايا؟', a: 'بين' },
        { q: 'مين صاحب الراسينغان؟', a: 'ناروتو' },
        { q: 'مين قائد فيلق الاستطلاع؟', a: 'ليفاي' },
        { q: 'مين أمير السايان؟', a: 'فيجيتا' },
        { q: 'مين أقوى نينجا طبي؟', a: 'تسونادي' },
        { q: 'مين أخو لوفي؟', a: 'ايس' },
        { q: 'مين قتل ايس؟', a: 'اكاينو' },
        { q: 'مين أقوى اوتشيها؟', a: 'مادارا' },
        { q: 'مين قائد البحرية؟', a: 'اكاينو' },
        { q: 'مين ملك الشياطين في ديمون سلاير؟', a: 'موزان' },
        { q: 'مين والد ناروتو؟', a: 'ميناتو' },
        { q: 'مين عنده رينغان؟', a: 'مادارا' },
        { q: 'مين أسرع نينجا؟', a: 'ميناتو' },
        { q: 'مين منافس لايت؟', a: 'ال' },
        { q: 'مين اللي هزم دوفلامينجو؟', a: 'لوفي' },
        { q: 'مين عنده بانكاي؟', a: 'ايشيدا' },
        { q: 'مين قائد الفرقة 13؟', a: 'اوكيتاكي' },
        { q: 'مين زعيم بلاك بول؟', a: 'يامي' },
        { q: 'مين أقوى شيطان في جوجوتسو؟', a: 'سكونا' },
        { q: 'مين بطل جوجوتسو؟', a: 'يوجي' },
        { q: 'مين معلم يوجي؟', a: 'غوجو' },
        { q: 'مين عنده عينين زرق؟', a: 'غوجو' },
        { q: 'مين عنده شعر أبيض في طوكيو غول؟', a: 'كانيكي' },
        { q: 'مين قائد الأكاتسوكي الحقيقي؟', a: 'اوبيتو' },
        { q: 'مين صاحب الجيتار في بيك؟', a: 'بيك' },
        { q: 'مين أول من استخدم البانكاي؟', a: 'ايشيدا' },
        { q: 'مين صاحب كتاب الموت؟', a: 'لايت' },
        { q: 'مين ملك الشياطين في بلاك كلوفر؟', a: 'استا' },
        { q: 'مين صاحب الفم في جلد يده؟', a: 'سكونا' },
        { q: 'مين قاتل كايدو؟', a: 'لوفي' },
        { q: 'مين صاحب قوة النار الزرقاء؟', a: 'ايس' },
        { q: 'مين صاحب قوة الجليد؟', a: 'ايس' },
        { q: 'مين أول ملك قراصنة؟', a: 'غول دي روجر' },
        { q: 'مين صاحب السيف العظيم؟', a: 'زورو' },
        { q: 'مين صاحب القدرة على الطيران؟', a: 'ناروتو' },
        { q: 'مين صاحب القدرة على التحكم في الظل؟', a: 'شيكامارو' },
        { q: 'مين صاحب القدرة على التحكم في النار؟', a: 'ناتسو' },
    ],
    صعب: [
        { q: 'من أول هوكاغي؟', a: 'هاشيراما' },
        { q: 'مين قتل عائلة تانجيرو؟', a: 'موزان' },
        { q: 'مين صاحب الرينغان الأصلي؟', a: 'مادارا' },
        { q: 'مين الهوكاغي الرابع؟', a: 'ميناتو' },
        { q: 'مين زعيم الأنبو؟', a: 'دانزو' },
        { q: 'مين أقوى شخصية في بليتش؟', a: 'ايزن' },
        { q: 'مين صاحب الإيزانامي؟', a: 'ايتاتشي' },
        { q: 'مين وحش الدمار؟', a: 'بيروس' },
        { q: 'مين ملك الشياطين؟', a: 'لوتشيفيرو' },
        { q: 'مين درب ميناتو؟', a: 'جيرايا' },
        { q: 'مين قتل مادارا؟', a: 'زيتسو' },
        { q: 'مين صاحب السوسانو الكامل؟', a: 'مادارا' },
        { q: 'مين أقوى ادميرال؟', a: 'اكاينو' },
        { q: 'مين عنده بانكاي كامل؟', a: 'ايزن' },
        { q: 'مين أقوى قائد في بليتش؟', a: 'ياماموتو' },
        { q: 'مين أول مستخدم للشارينغان؟', a: 'مادارا' },
        { q: 'مين اللي أسس كونوها؟', a: 'هاشيراما' },
        { q: 'مين عنده جينجتسو قوي؟', a: 'ايتاتشي' },
        { q: 'مين أقوى مستخدم ناروتو؟', a: 'مادارا' },
        { q: 'مين أقوى شخصية في ون بيس؟', a: 'لوفي' },
        { q: 'مين أقوى شخصية في دراغون بول؟', a: 'غوكو' },
        { q: 'مين أقوى شيطان؟', a: 'سكونا' },
        { q: 'مين عنده تقنية لانهائية؟', a: 'غوجو' },
        { q: 'مين أقوى ساحر؟', a: 'غوجو' },
        { q: 'مين أقوى غول؟', a: 'كانيكي' },
        { q: 'مين تحول لوحش في طوكيو غول؟', a: 'كانيكي' },
        { q: 'مين أقوى قائد في بلاك كلوفر؟', a: 'يامي' },
        { q: 'مين صاحب السيف الأسود؟', a: 'زورو' },
        { q: 'مين المستفيد الحقيقي من حرب النينجا؟', a: 'اوروتشيمارو' },
        { q: 'مين قاتل الشيطان الأقوى؟', a: 'تانجيرو' },
        { q: 'مين صاحب العين المشعة؟', a: 'غوجو' },
        { q: 'مين صاحب الجسد الأبيض؟', a: 'موزان' },
        { q: 'مين صاحب القدرة على التحكم في الوقت؟', a: 'جوتارو' },
        { q: 'مين صاحب القدرة على التحكم في المكان؟', a: 'اوكيتاكي' },
        { q: 'مين صاحب القدرة على إحياء الموتى؟', a: 'اوروتشيمارو' },
        { q: 'مين صاحب القدرة على القراءة الذهنية؟', a: 'ليلاي' },
        { q: 'مين صاحب القدرة على التحكم في العقول؟', a: 'ايتاتشي' },
        { q: 'مين صاحب القدرة على التحكم في الوهم؟', a: 'مادارا' },
        { q: 'مين صاحب القدرة على التحكم في الوقت والمكان؟', a: 'جوتارو' },
        { q: 'مين صاحب القدرة على التحكم في الموت؟', a: 'بين' },
    ]
};

// ============================================================
// 📤 دالة الإرسال الموحدة
// ============================================================
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🎌 لـعـبـة الأنـمـي 🎌\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
        if (line && line.trim()) {
            msg += `${line}\n`;
        }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `𝘽𝙔┇𝑷𝑯𝑨𝑵𝑻𝑶𝑴`;

    await sock.sendMessage(chatId, { text: msg, mentions }, { quoted: quoted });
}

// ============================================================
// 📋 الأمر الرئيسي
// ============================================================
module.exports = {
    command: ['انمي'],
    description: '🎌 فعالية أسئلة أنمي متطورة مع نقاط وتصنيف',
    usage: '.انمي [سهل | متوسط | صعب]',
    category: 'فعاليات',

    async execute(sock, m) {
        try {
            const chatId = m.key.remoteJid;
            const sender = m.key.participant || m.participant || m.key.remoteJid;
            const fullText = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/).slice(1);
            const level = (args[0] || '').trim();

            // ============================================================
            // 🧠 عرض المستوى إذا لم يحدد
            // ============================================================
            if (!['سهل', 'متوسط', 'صعب'].includes(level)) {
                const points = loadJSON(pointsPath);
                const userPoints = points[sender] || 0;

                const lines = [
                    `🎌 *فعالية أسئلة أنمي* 🔥`,
                    '',
                    `📊 نقاطك: ${formatNumber(userPoints)}`,
                    `🎖️ رتبتك: ${getLevel(userPoints)}`,
                    '',
                    '📌 *اختر المستوى:*',
                    `🟢 .انمي سهل   (💰 ${settings.سهل.reward} | ❌ -${settings.سهل.penalty})`,
                    `🟡 .انمي متوسط (💰 ${settings.متوسط.reward} | ❌ -${settings.متوسط.penalty})`,
                    `🔴 .انمي صعب   (💰 ${settings.صعب.reward} | ❌ -${settings.صعب.penalty})`
                ];

                await sendMessage(sock, chatId, lines, m, [sender]);
                return;
            }

            // ============================================================
            // 🎯 بدء اللعبة
            // ============================================================
            const qa = questions[level][Math.floor(Math.random() * questions[level].length)];
            const correct = qa.a.trim().toLowerCase();

            const points = loadJSON(pointsPath);
            const ranks = loadJSON(ranksPath);
            const streak = loadJSON(streakPath);

            const userPoints = points[sender] || 0;

            // إرسال السؤال
            const questionLines = [
                `🎌 *سؤال أنمي* 🔥`,
                '',
                `📊 المستوى: ${level}`,
                `❓ ${qa.q}`,
                `⏳ ${settings[level].time / 1000} ثانية`,
                `💰 المكافأة: +${settings[level].reward}`,
                `⚠️ العقاب: -${settings[level].penalty}`,
                '',
                `📊 نقاطك: ${formatNumber(userPoints)}`,
                `🏅 رتبتك: ${getLevel(userPoints)}`
            ];

            await sendMessage(sock, chatId, questionLines, m, [sender]);

            let ended = false;
            let timeoutId = null;

            // ============================================================
            // 📨 معالج الإجابات
            // ============================================================
            const handler = async ({ messages }) => {
                for (const msg of messages) {
                    try {
                        if (ended) return;
                        if (msg.key.remoteJid !== chatId) continue;
                        if (msg.key.fromMe) continue;

                        const txt = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                        if (!txt) continue;

                        const trimmed = txt.trim().toLowerCase();

                        // التحقق من الإجابة
                        if (trimmed === correct) {
                            ended = true;
                            clearTimeout(timeoutId);
                            sock.ev.off('messages.upsert', handler);

                            const winner = msg.key.participant || msg.participant || msg.key.remoteJid;

                            // حساب المكافأة
                            let totalReward = settings[level].reward;

                            // مكافأة السلسلة
                            const userStreak = streak[winner] || 0;
                            const newStreak = userStreak + 1;
                            streak[winner] = newStreak;

                            let bonusMsg = '';
                            for (const [threshold, bonus] of Object.entries(streakBonus)) {
                                if (newStreak === parseInt(threshold)) {
                                    totalReward += bonus;
                                    bonusMsg = `\n🎁 مكافأة سلسلة (+${bonus})`;
                                    break;
                                }
                            }

                            // تحديث النقاط والرتب
                            points[winner] = (points[winner] || 0) + totalReward;
                            ranks[winner] = (ranks[winner] || 0) + 1;
                            saveJSON(pointsPath, points);
                            saveJSON(ranksPath, ranks);
                            saveJSON(streakPath, streak);

                            const winnerLines = [
                                '✅ *إجابة صحيحة!* 🏆',
                                '',
                                `👑 *الفائز:* @${winner.split('@')[0]}`,
                                `✅ *الإجابة:* ${qa.a}`,
                                `💰 *المكافأة:* +${totalReward} نقطة${bonusMsg}`,
                                `📊 *نقاطك:* ${formatNumber(points[winner])}`,
                                `🎖️ *رتبتك:* ${getLevel(points[winner])}`,
                                `🔥 *السلسلة:* ${newStreak} إجابة متتالية`
                            ];

                            await sendMessage(sock, chatId, winnerLines, msg, [winner]);
                            return;
                        }
                    } catch (err) {
                        console.error('❌ خطأ في المعالج:', err);
                    }
                }
            };

            sock.ev.on('messages.upsert', handler);

            // ============================================================
            // ⏰ المهلة
            // ============================================================
            timeoutId = setTimeout(async () => {
                if (ended) return;
                ended = true;
                sock.ev.off('messages.upsert', handler);

                // خصم من صاحب السؤال
                const penalty = settings[level].penalty;
                points[sender] = (points[sender] || 0) - penalty;
                streak[sender] = 0;
                saveJSON(streakPath, streak);
                saveJSON(pointsPath, points);

                const timeoutLines = [
                    '⏰ *انتهى الوقت!*',
                    '',
                    `📌 *الإجابة الصحيحة:* ${qa.a}`,
                    `❌ *تم خصم:* ${penalty} نقطة`,
                    `📊 *نقاطك الآن:* ${formatNumber(points[sender])}`,
                    `🎖️ *رتبتك:* ${getLevel(points[sender])}`
                ];

                await sendMessage(sock, chatId, timeoutLines, m, [sender]);
            }, settings[level].time);

        } catch (error) {
            console.error('❌ خطأ في أمر انمي:', error);
            await sendMessage(sock, m.key.remoteJid, [
                '❌ *حدث خطأ*',
                '',
                `📝 ${error.message || 'خطأ غير معروف'}`,
                '',
                '📌 حاول مرة أخرى لاحقاً'
            ], m);
        }
    }
};