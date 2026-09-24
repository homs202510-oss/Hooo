// اسلام.js - فعالية أسئلة إسلامية (نفس نظام تفكيك)

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

// ========== دالة تطبيع النص ==========
function normalizeAnswer(text) {
    return text
        .toLowerCase()
        .replace(/[ًٌٍَُِّْـ]/g, '')
        .replace(/أ|إ|آ/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/\s+/g, '')
        .trim();
}

// ========== دالة الإرسال بتنسيق موحد ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🕌 أسـئـلـة إسـلامـيـة 🕌\n`;
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

// ========== إعدادات اللعبة ==========
const rewardPoints = 100;
const penaltyPoints = 50;
const questionTime = 30000; // 30 ثانية

// ========== قائمة الأسئلة الإسلامية (100+ سؤال) ==========
const questions = [
    { question: 'ما هو أول أركان الإسلام؟', answer: 'الشهادتان' },
    { question: 'كم عدد أركان الإسلام؟', answer: 'خمسة' },
    { question: 'كم عدد أركان الإيمان؟', answer: 'ستة' },
    { question: 'من هو خاتم الأنبياء؟', answer: 'محمد' },
    { question: 'في أي شهر يصوم المسلمون؟', answer: 'رمضان' },
    { question: 'ما اسم الكتاب الذي أُنزل على النبي محمد؟', answer: 'القرآن' },
    { question: 'كم عدد الصلوات المفروضة يوميًا؟', answer: 'خمس' },
    { question: 'ما اسم أول مسجد بُني في الإسلام؟', answer: 'قباء' },
    { question: 'من هو النبي الذي ابتلعه الحوت؟', answer: 'يونس' },
    { question: 'في أي ليلة نزل القرآن؟', answer: 'القدر' },
    { question: 'ما هي القبلة التي يتوجه إليها المسلمون؟', answer: 'الكعبة' },
    { question: 'من هو أول خليفة للمسلمين؟', answer: 'أبو بكر' },
    { question: 'من هو ثاني الخلفاء الراشدين؟', answer: 'عمر بن الخطاب' },
    { question: 'من هو ثالث الخلفاء الراشدين؟', answer: 'عثمان بن عفان' },
    { question: 'من هو رابع الخلفاء الراشدين؟', answer: 'علي بن أبي طالب' },
    { question: 'كم عدد سور القرآن الكريم؟', answer: '114' },
    { question: 'ما هي أطول سورة في القرآن؟', answer: 'البقرة' },
    { question: 'ما هي أقصر سورة في القرآن؟', answer: 'الكوثر' },
    { question: 'ما اسم والدة النبي محمد؟', answer: 'آمنة' },
    { question: 'ما اسم والد النبي محمد؟', answer: 'عبدالله' },
    { question: 'من هي أول زوجات النبي؟', answer: 'خديجة' },
    { question: 'من هو أول من آمن من الرجال؟', answer: 'أبو بكر' },
    { question: 'من هو أول من آمن من النساء؟', answer: 'خديجة' },
    { question: 'من هو أول مؤذن في الإسلام؟', answer: 'بلال' },
    { question: 'ما اسم ناقة النبي؟', answer: 'القصواء' },
    { question: 'إلى أين كانت هجرة النبي؟', answer: 'المدينة' },
    { question: 'من بنى الكعبة مع إبراهيم؟', answer: 'إسماعيل' },
    { question: 'من هو النبي الملقب بخليل الله؟', answer: 'إبراهيم' },
    { question: 'من هو النبي الذي كلمه الله؟', answer: 'موسى' },
    { question: 'من هو النبي الذي ولد بدون أب؟', answer: 'عيسى' },
    { question: 'من هو أول البشر؟', answer: 'آدم' },
    { question: 'من هو آخر الأنبياء؟', answer: 'محمد' },
    { question: 'كم عدد أبواب الجنة؟', answer: 'ثمانية' },
    { question: 'كم عدد أبواب النار؟', answer: 'سبعة' },
    { question: 'ما اسم ملك الوحي؟', answer: 'جبريل' },
    { question: 'من هو ملك الموت؟', answer: 'عزرائيل' },
    { question: 'ما اسم أول سورة في القرآن؟', answer: 'الفاتحة' },
    { question: 'ما اسم آخر سورة في القرآن؟', answer: 'الناس' },
    { question: 'ما السورة التي تعدل ثلث القرآن؟', answer: 'الإخلاص' },
    { question: 'كم مرة حج النبي؟', answer: 'مرة' },
    { question: 'ما اسم زوجة فرعون المؤمنة؟', answer: 'آسية' },
    { question: 'من هو الصحابي الملقب بسيف الله المسلول؟', answer: 'خالد بن الوليد' },
    { question: 'من هو الصحابي الملقب بالفاروق؟', answer: 'عمر بن الخطاب' },
    { question: 'من هو الصحابي الملقب بذي النورين؟', answer: 'عثمان بن عفان' },
    { question: 'كم عدد أجزاء القرآن؟', answer: '30' },
    { question: 'كم عدد الأحزاب في القرآن؟', answer: '60' },
    { question: 'ما هي السورة التي لا تبدأ بالبسملة؟', answer: 'التوبة' },
    { question: 'من هو النبي الذي صنع السفينة؟', answer: 'نوح' },
    { question: 'ما اسم ابن نوح الذي غرق؟', answer: 'كنعان' },
    { question: 'ما اسم أم موسى؟', answer: 'يوكابد' },
    { question: 'من هو النبي الذي فداه الله بذبح عظيم؟', answer: 'إسماعيل' },
    { question: 'من هو النبي الذي سخر الله له الريح؟', answer: 'سليمان' },
    { question: 'من هو النبي الذي اشتهر بالصبر؟', answer: 'أيوب' },
    { question: 'من هو النبي الذي فسره الأحلام؟', answer: 'يوسف' },
    { question: 'في أي بحر انشق لموسى؟', answer: 'الأحمر' },
    { question: 'ما اسم الغار الذي نزل فيه الوحي؟', answer: 'حراء' },
    { question: 'ما اسم الغار الذي اختبأ فيه النبي أثناء الهجرة؟', answer: 'ثور' },
    { question: 'كم سنة استمرت دعوة النبي في مكة؟', answer: '13' },
    { question: 'كم سنة استمرت دعوته في المدينة؟', answer: '10' },
    { question: 'كم كان عمر النبي عند وفاته؟', answer: '63' },
    { question: 'ما اسم والد إبراهيم؟', answer: 'آزر' },
    { question: 'من هو النبي الذي ابتلاه الله بالمرض؟', answer: 'أيوب' },
    { question: 'من هو النبي الذي رفعه الله إلى السماء؟', answer: 'عيسى' },
    { question: 'ما أول ما يحاسب عليه العبد؟', answer: 'الصلاة' },
    { question: 'ما الركن الرابع من أركان الإسلام؟', answer: 'صيام رمضان' },
    { question: 'ما الركن الخامس من أركان الإسلام؟', answer: 'الحج' },
    { question: 'كم عدد التكبيرات في الأذان؟', answer: 'أربع' },
    { question: 'ما اسم ماء زمزم الذي تفجر لإسماعيل؟', answer: 'زمزم' },
    { question: 'ما هي عاصمة الدولة الإسلامية الأولى؟', answer: 'المدينة' },
    { question: 'من هو قائد غزوة مؤتة؟', answer: 'زيد بن حارثة' },
    { question: 'من هو أول سفير في الإسلام؟', answer: 'مصعب بن عمير' },
    { question: 'كم عدد زوجات النبي بعد خديجة؟', answer: '11' },
    { question: 'من هي أم المؤمنين الملقبة بالحميراء؟', answer: 'عائشة' },
    { question: 'في أي شهر وقعت غزوة بدر؟', answer: 'رمضان' },
    { question: 'كم عدد المسلمين في بدر؟', answer: '313' },
    { question: 'ما اسم سيف النبي؟', answer: 'ذو الفقار' },
    { question: 'من هو ابن النبي؟', answer: 'إبراهيم' },
    { question: 'كم عدد بنات النبي؟', answer: 'أربع' },
    { question: 'ما اسم أكبر بنات النبي؟', answer: 'زينب' },
    { question: 'من هو أول شهيد في الإسلام؟', answer: 'سمية' },
    { question: 'من هو الصحابي الذي نام في فراش النبي ليلة الهجرة؟', answer: 'علي بن أبي طالب' },
    { question: 'كم مرة ذكرت مريم في القرآن؟', answer: '34' },
    { question: 'ما اسم أم عيسى؟', answer: 'مريم' },
    { question: 'من هو النبي الذي أُرسل إلى قوم عاد؟', answer: 'هود' },
    { question: 'من هو النبي الذي أُرسل إلى قوم ثمود؟', answer: 'صالح' },
    { question: 'ما اسم ناقة صالح؟', answer: 'ناقة الله' },
    { question: 'من هو النبي الذي بلعته النار ولم تحرقه؟', answer: 'إبراهيم' },
    { question: 'ما أول معركة في الإسلام؟', answer: 'بدر' },
    { question: 'ما آخر غزوة للنبي؟', answer: 'تبوك' },
    { question: 'كم عدد أيام السنة الهجرية؟', answer: '354' },
    { question: 'ما أول شهر هجري؟', answer: 'محرم' },
    { question: 'ما آخر شهر هجري؟', answer: 'ذو الحجة' },
    { question: 'ما اسم ليلة مباركة خير من ألف شهر؟', answer: 'ليلة القدر' },
    { question: 'ما اسم صلاة العيد الأولى في السنة؟', answer: 'الفطر' },
    { question: 'كم عدد مرات السعي بين الصفا والمروة؟', answer: 'سبعة' },
    { question: 'من هو النبي الذي ورث ملك أبيه داود؟', answer: 'سليمان' },
    { question: 'من هو أول رسول إلى البشر؟', answer: 'نوح' }
];

// ========== منع تكرار الألعاب ==========
const activeGames = new Map();

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['اسلام'],
    description: '🕌 أسئلة إسلامية (الكل يشارك)',
    category: 'فعاليات',
    usage: '.اسلام',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const sender = msg.key.participant || msg.participant || msg.key.remoteJid;
            const senderNum = sender.split('@')[0];

            // ===== التحقق من وجود لعبة نشطة =====
            if (activeGames.has(chatId)) {
                await sendMessage(sock, chatId, [
                    '⚠️ *يوجد سؤال نشط*',
                    '',
                    '📌 انتظر حتى تنتهي اللعبة الحالية'
                ], msg);
                return;
            }

            // ===== اختيار سؤال عشوائي =====
            const selected = questions[Math.floor(Math.random() * questions.length)];
            const questionText = selected.question;
            const correctAnswer = selected.answer;

            // ===== تسجيل اللعبة =====
            activeGames.set(chatId, true);

            // ===== إرسال السؤال =====
            await sendMessage(sock, chatId, [
                `🕌 *السؤال الإسلامي:*`,
                '',
                `❓ ${questionText}`,
                '',
                `⏳ *الوقت:* ${questionTime / 1000} ثواني`,
                `💰 *المكافأة:* +${rewardPoints} نقطة`,
                `⚠️ *العقاب:* -${penaltyPoints} نقطة (للمنشئ فقط)`,
                `👤 *المنشئ:* @${senderNum}`,
                '',
                '✍️ أرسل الإجابة الصحيحة',
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

                    // ===== مقارنة الإجابة (بعد التطبيع) =====
                    if (normalizeAnswer(txt) === normalizeAnswer(correctAnswer)) {
                        ended = true;
                        clearTimeout(timer);
                        sock.ev.off('messages.upsert', handler);
                        activeGames.delete(chatId);

                        // تحديث النقاط
                        points[answerer] = (points[answerer] || 0) + rewardPoints;
                        ranks[answerer] = (ranks[answerer] || 0) + 1;
                        saveJSON(pointsPath, points);
                        saveJSON(ranksPath, ranks);

                        await sendMessage(sock, chatId, [
                            '🎉 *إجابة صحيحة!* 🎉',
                            '',
                            `🏆 *الفائز:* @${answerer.split('@')[0]}`,
                            `🕌 *السؤال:* ${questionText}`,
                            `✅ *الإجابة:* ${correctAnswer}`,
                            `💰 *المكافأة:* +${rewardPoints} نقطة`,
                            `📈 *رصيدك:* ${formatNumber(points[answerer] || 0)} نقطة`,
                            `🏅 *رتبتك:* ${getLevel(points[answerer] || 0)}`,
                            `🎖️ *عدد الإجابات الصحيحة:* ${ranks[answerer] || 0}`
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
                activeGames.delete(chatId);

                // خصم نقاط من المنشئ فقط
                points[sender] = (points[sender] || 0) - penaltyPoints;
                saveJSON(pointsPath, points);

                await sendMessage(sock, chatId, [
                    '⏰ *انتهى الوقت!*',
                    '',
                    `🕌 *السؤال:* ${questionText}`,
                    `✅ *الإجابة الصحيحة:* ${correctAnswer}`,
                    `➖ *تم خصم:* ${penaltyPoints} نقطة من المنشئ`,
                    `📈 *رصيد المنشئ:* ${formatNumber(points[sender] || 0)} نقطة`,
                    `🏅 *رتبة المنشئ:* ${getLevel(points[sender] || 0)}`,
                    `👤 *المنشئ:* @${senderNum}`
                ], null, [sender]);

            }, questionTime);

        } catch (error) {
            console.error('❌ خطأ في أمر اسلام:', error);
            activeGames.delete(msg.key.remoteJid);
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