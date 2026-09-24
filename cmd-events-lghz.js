// لغز.js - فعالية الألغاز والأسئلة الذكية (نسخة محسنة مثل سؤال)

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
function normalize(str) {
    return str.trim()
        .replace(/[أإآ]/g, 'ا')
        .replace(/[ى]/g, 'ي')
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

function isMatching(input, target) {
    return normalize(input) === normalize(target);
}

// ========== دالة الإرسال بتنسيق موحد ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🧠 ألغـاز وأسـئـلـة 🧠\n`;
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

// ========== قائمة الألغاز حسب المستوى ==========
const riddles = {
    سهل: [
        { question: 'ما هو الشيء الذي يمشي بلا رجلين ويبكي بلا عينين؟', answer: 'سحاب' },
        { question: 'ما هو الشيء الذي كلما أخذت منه كبر؟', answer: 'حفرة' },
        { question: 'أين يقع البحر الذي لا ماء فيه؟', answer: 'الخريطة' },
        { question: 'ما هو الشيء الذي تراه في الليل 3 مرات وفي النهار مرة؟', answer: 'حرف اللام' },
        { question: 'شيء له أوراق لكنه ليس شجراً، وله جلد لكنه ليس حيواناً، فما هو؟', answer: 'كتاب' },
        { question: 'ما هو الشيء الذي كلما زاد نقص؟', answer: 'العمر' },
        { question: 'ما هو الشيء الذي له رأس ولا عين له، وله عين ولا رأس له؟', answer: 'ابرة وخيط' },
        { question: 'كلمة تتكون من 4 حروف، إذا أكلت نصفها تموت، فما هي؟', answer: 'سمسم' },
        { question: 'ما هو السؤال الذي تختلف إجابته دائماً؟', answer: 'كم الساعة' },
        { question: 'ما هو الشيء الذي لا يدخل إلا إذا ضرب على رأسه؟', answer: 'مسمار' },
        { question: 'ما هو الشيء الذي له أربع أرجل ولا يمشي؟', answer: 'كرسي' },
        { question: 'ما هو الشيء الذي يكون أخضر في الأرض وأسود في السوق وأحمر في البيت؟', answer: 'شاي' },
        { question: 'ما هو الشيء الذي ينام ولا يستيقظ؟', answer: 'الميت' },
        { question: 'ما هو الشيء الذي إذا وضعته في الثلاجة لا يبرد؟', answer: 'فلفل' },
        { question: 'ما هو الشيء الذي إذا شربت منه تموت وإذا أكلته تعيش؟', answer: 'سمكة' },
        { question: 'ما هو الشيء الذي يسمع بلا أذن ويتكلم بلا لسان؟', answer: 'تلفاز' },
        { question: 'ما هو الشيء الذي يكون في السماء وإذا أضفت له حرفاً أصبح في الأرض؟', answer: 'نجم' },
        { question: 'ما هو الشيء الذي يكتب ولا يقرأ؟', answer: 'قلم' },
        { question: 'ما هو الشيء الذي كلما مشى أطول؟', answer: 'ظل' },
        { question: 'ما هو الشيء الذي يغني بلا صوت؟', answer: 'طائر' },
        { question: 'ما هو الشيء الذي يطير بلا أجنحة؟', answer: 'وقت' },
        { question: 'ما هو الشيء الذي يذهب ولا يعود؟', answer: 'الكلمة' },
        { question: 'ما هو الشيء الذي كلما أكلت منه جعت؟', answer: 'الجوع' },
        { question: 'ما هو الشيء الذي يموت إذا شرب الماء؟', answer: 'نار' },
        { question: 'ما هو الشيء الذي يحمل طعامه فوق رأسه؟', answer: 'نملة' },
        { question: 'ما هو الشيء الذي كلما طال قصر؟', answer: 'العمر' },
        { question: 'ما هو الشيء الذي يضحك بلا فم ويبكي بلا عين؟', answer: 'سحاب' },
        { question: 'ما هو الشيء الذي تأكل منه ولا تأكله？', answer: 'طبق' },
        { question: 'ما هو الشيء الذي ينام على جنبه ويمشي على أربع؟', answer: 'سلحفاة' },
        { question: 'ما هو الشيء الذي يخاف من الضوء؟', answer: 'ظل' },
        { question: 'ما هو الشيء الذي يبتعد عنك كلما اقتربت منه؟', answer: 'الأفق' },
        { question: 'ما هو الشيء الذي له رقبة بلا رأس？', answer: 'زجاجة' },
        { question: 'ما هو الشيء الذي إذا حذفت أوله صار اسم فاكهة؟', answer: 'تفاح' },
        { question: 'ما هو الشيء الذي كلما زاد وزنه نقص سعره？', answer: 'نحاس' },
        { question: 'ما هو الشيء الذي لا يستفيد منه إلا إذا كسر؟', answer: 'بيضة' },
        { question: 'ما هو الشيء الذي يبكي بلا عين ويطير بلا جناح؟', answer: 'سحاب' },
        { question: 'ما هو الشيء الذي له يد ولا يصفق؟', answer: 'ساعة' },
        { question: 'ما هو الشيء الذي يجري بلا رجلين؟', answer: 'ماء' },
        { question: 'ما هو الشيء الذي يسير بلا قدمين؟', answer: 'وقت' },
        { question: 'ما هو الشيء الذي يعرف كل شيء ولا يتكلم؟', answer: 'كتاب' },
        { question: 'ما هو الشيء الذي تأكله ولا تشبعه？', answer: 'نار' },
        { question: 'ما هو الشيء الذي لا يعرف الكذب؟', answer: 'مرآة' },
        { question: 'ما هو الشيء الذي لا ينام ولا يأكل؟', answer: 'حجر' },
        { question: 'ما هو الشيء الذي يكتب ولا يقرأ ولا يأكل؟', answer: 'قلم' },
        { question: 'ما هو الشيء الذي إذا قلت اسمه انكسر？', answer: 'صمت' },
        { question: 'ما هو الشيء الذي يضرب بلا ألم؟', answer: 'ساعة' },
        { question: 'ما هو الشيء الذي ينام على ظهره ويصحو على بطنه？', answer: 'سمكة' },
        { question: 'ما هو الشيء الذي يخرج من النار ويخاف من الماء؟', answer: 'رماد' },
        { question: 'ما هو الشيء الذي له عين ولا يرى؟', answer: 'إبرة' },
        { question: 'ما هو الشيء الذي له أذن ولا يسمع？', answer: 'إبريق' }
    ],
    متوسط: [
        { question: 'أنا شيء أحملك وأنت تحملني، فمن أنا؟', answer: 'حذاء' },
        { question: 'ما هو الشيء الذي لا يبلل حتى لو دخل الماء؟', answer: 'ضوء' },
        { question: 'عمتك اخت ابوك وليست اخت امك، فمن تكون؟', answer: 'أمي' },
        { question: 'ما هو الشيء الذي يقرصك ولا تراه؟', answer: 'جوع' },
        { question: 'من هي المرأة التي ترى أعدائها وأصدقائها بعين واحدة？', answer: 'الأعور' },
        { question: 'ما هو الشيء الذي يلف حول الغرفة دون أن يتحرك？', answer: 'جدار' },
        { question: 'لونه أسود ولا ينفع إلا حين يكون أبيض، فما هو؟', answer: 'طباشير' },
        { question: 'شيء اسمه مثل لونه، فما هو؟', answer: 'بيضة' },
        { question: 'أنا أبو معاذ، ومعاذ لا يعرفني، ومعاذ يعرفني وأنا لا أعرفه، فمن أنا؟', answer: 'الظل' },
        { question: 'ما هو الشيء الذي يسمع بلا أذن ويتكلم بلا لسان؟', answer: 'تلفاز' },
        { question: 'ما هو الشيء الذي له أسنان ولا يعض؟', answer: 'مشط' },
        { question: 'ما هو الشيء الذي يظهر في الليل ويختفي في النهار؟', answer: 'نجم' },
        { question: 'ما هو الشيء الذي له لسان ولا يتكلم？', answer: 'حذاء' },
        { question: 'ما هو الشيء الذي يطلع من الماء ويموت في الهواء؟', answer: 'فقاعة' },
        { question: 'ما هو الشيء الذي يمر من بين الأشجار ولا يحركها؟', answer: 'ريح' },
        { question: 'ما هو الشيء الذي يبني بيوتاً ولا يسكنها؟', answer: 'نمل' },
        { question: 'ما هو الشيء الذي يأكل ولا يشبع؟', answer: 'نار' },
        { question: 'ما هو الشيء الذي له جيب بلا ثياب؟', answer: 'كنغر' },
        { question: 'ما هو الشيء الذي لا يدخل إلا إذا ضرب على رأسه؟', answer: 'مسمار' },
        { question: 'ما هو الشيء الذي يلف حولك ولا تراه؟', answer: 'هواء' },
        { question: 'ما هو الشيء الذي له عين ولا يبصر？', answer: 'إبرة' },
        { question: 'ما هو الشيء الذي له رقبة بلا رأس？', answer: 'زجاجة' },
        { question: 'ما هو الشيء الذي يكتب ولا يقرأ؟', answer: 'قلم' },
        { question: 'ما هو الشيء الذي يعطيك ولا يأخذ？', answer: 'وقت' },
        { question: 'ما هو الشيء الذي يجري ولا يتعب؟', answer: 'ماء' },
        { question: 'ما هو الشيء الذي يموت إذا شرب الماء؟', answer: 'نار' },
        { question: 'ما هو الشيء الذي له يد ولا يصافح؟', answer: 'ساعة' },
        { question: 'ما هو الشيء الذي له أذن ولا يسمع؟', answer: 'إبريق' },
        { question: 'ما هو الشيء الذي يضحك بلا فم？', answer: 'سحاب' },
        { question: 'ما هو الشيء الذي يبكي بلا عين？', answer: 'سحاب' },
        { question: 'ما هو الشيء الذي يطير بلا جناح？', answer: 'وقت' },
        { question: 'ما هو الشيء الذي يذهب ولا يعود？', answer: 'الكلمة' },
        { question: 'ما هو الشيء الذي كلما أكلت منه جعت？', answer: 'الجوع' },
        { question: 'ما هو الشيء الذي يحمل طعامه فوق رأسه？', answer: 'نملة' },
        { question: 'ما هو الشيء الذي كلما طال قصر？', answer: 'العمر' },
        { question: 'ما هو الشيء الذي ينام على جنبه ويمشي على أربع？', answer: 'سلحفاة' },
        { question: 'ما هو الشيء الذي يخاف من الضوء？', answer: 'ظل' },
        { question: 'ما هو الشيء الذي يبتعد عنك كلما اقتربت منه؟', answer: 'الأفق' },
        { question: 'ما هو الشيء الذي له رقبة بلا رأس؟', answer: 'زجاجة' },
        { question: 'ما هو الشيء الذي إذا حذفت أوله صار اسم فاكهة؟', answer: 'تفاح' },
        { question: 'ما هو الشيء الذي كلما زاد وزنه نقص سعره؟', answer: 'نحاس' },
        { question: 'ما هو الشيء الذي لا يستفيد منه إلا إذا كسر؟', answer: 'بيضة' },
        { question: 'ما هو الشيء الذي يبكي بلا عين ويطير بلا جناح？', answer: 'سحاب' },
        { question: 'ما هو الشيء الذي له يد ولا يصفق？', answer: 'ساعة' },
        { question: 'ما هو الشيء الذي يجري بلا رجلين？', answer: 'ماء' },
        { question: 'ما هو الشيء الذي يسير بلا قدمين？', answer: 'وقت' },
        { question: 'ما هو الشيء الذي يعرف كل شيء ولا يتكلم？', answer: 'كتاب' },
        { question: 'ما هو الشيء الذي تأكله ولا تشبعه؟', answer: 'نار' },
        { question: 'ما هو الشيء الذي لا يعرف الكذب؟', answer: 'مرآة' },
        { question: 'ما هو الشيء الذي لا ينام ولا يأكل？', answer: 'حجر' }
    ],
    صعب: [
        { question: 'ما هو الرقم الذي إذا ضربته في أي رقم آخر يبقى الناتج كما هو؟', answer: 'صفر' },
        { question: 'كائن حي لا يموت إلا إذا قطع رأسه، فما هو؟', answer: 'ثعبان' },
        { question: 'أنا أتحدث جميع لغات العالم، فمن أنا؟', answer: 'صدى' },
        { question: 'شيء تملكه ويستخدمه الآخرون أكثر منك، فما هو؟', answer: 'اسمك' },
        { question: 'ما هو الشيء الذي يتحرك دائماً ولكن يبقى في مكانه؟', answer: 'الساعة' },
        { question: 'ما هو الشهر الذي إذا حذفت أول حرف منه أصبح اسم فاكهة؟', answer: 'تموز' },
        { question: 'شيء كلما أسرعت به تركته، فما هو؟', answer: 'الظل' },
        { question: 'أخت خالك وليست خالتك، فمن تكون؟', answer: 'أمي' },
        { question: 'ما هو الحيوان الذي يحك أذنه بأنفه？', answer: 'فيل' },
        { question: 'سمكة لا تأكلها إلا بعد أن تموت وتنظف وتملح، فما هي？', answer: 'رنجة' },
        { question: 'ما هو الشيء الذي تأكله ولا يمكنك أن تشربه، وإذا شربته تموت？', answer: 'سمك' },
        { question: 'ما هو الشيء الذي له عين واحدة ولا يرى؟', answer: 'إبرة' },
        { question: 'ما هو الشيء الذي يسبح في الماء ولا يبتل？', answer: 'ظل' },
        { question: 'ما هو الشيء الذي له أذرع ولا يحتضن؟', answer: 'كرسي' },
        { question: 'ما هو الشيء الذي يلبسه الإنسان ولا يراه？', answer: 'صوت' },
        { question: 'ما هو الشيء الذي إذا أكلته كله استفدت، وإذا أكلت نصفه مت؟', answer: 'سمسم' },
        { question: 'ما هو الشيء الذي يبدأ بالحرف "م" وينتهي بالحرف "ت" وهو شيء نأكله؟', answer: 'موز' },
        { question: 'ما هو الشيء الذي ينظر إليك دون أن تراه؟', answer: 'مرآة' },
        { question: 'ما هو الشيء الذي يكتب ولا يقرأ？', answer: 'قلم' },
        { question: 'ما هو الشيء الذي يقرصك ولا تراه？', answer: 'جوع' },
        { question: 'ما هو الشيء الذي له أسنان ولا يأكل؟', answer: 'مشط' },
        { question: 'ما هو الشيء الذي يبني البيوت ولا يسكنها？', answer: 'نمل' },
        { question: 'ما هو الشيء الذي يأكل ولا يشبع؟', answer: 'نار' },
        { question: 'ما هو الشيء الذي له جيب بلا ثياب？', answer: 'كنغر' },
        { question: 'ما هو الشيء الذي لا يدخل إلا إذا ضرب على رأسه？', answer: 'مسمار' },
        { question: 'ما هو الشيء الذي يلف حولك ولا تراه？', answer: 'هواء' },
        { question: 'ما هو الشيء الذي له عين ولا يبصر？', answer: 'إبرة' },
        { question: 'ما هو الشيء الذي له رقبة بلا رأس？', answer: 'زجاجة' },
        { question: 'ما هو الشيء الذي يعطيك ولا يأخذ？', answer: 'وقت' },
        { question: 'ما هو الشيء الذي يجري ولا يتعب？', answer: 'ماء' },
        { question: 'ما هو الشيء الذي يموت إذا شرب الماء？', answer: 'نار' },
        { question: 'ما هو الشيء الذي له يد ولا يصافح？', answer: 'ساعة' },
        { question: 'ما هو الشيء الذي له أذن ولا يسمع？', answer: 'إبريق' },
        { question: 'ما هو الشيء الذي يضحك بلا فم？', answer: 'سحاب' },
        { question: 'ما هو الشيء الذي يبكي بلا عين？', answer: 'سحاب' },
        { question: 'ما هو الشيء الذي يطير بلا جناح？', answer: 'وقت' },
        { question: 'ما هو الشيء الذي يذهب ولا يعود؟', answer: 'الكلمة' },
        { question: 'ما هو الشيء الذي كلما أكلت منه جعت？', answer: 'الجوع' },
        { question: 'ما هو الشيء الذي يحمل طعامه فوق رأسه؟', answer: 'نملة' },
        { question: 'ما هو الشيء الذي كلما طال قصر？', answer: 'العمر' },
        { question: 'ما هو الشيء الذي ينام على جنبه ويمشي على أربع؟', answer: 'سلحفاة' },
        { question: 'ما هو الشيء الذي يخاف من الضوء？', answer: 'ظل' },
        { question: 'ما هو الشيء الذي يبتعد عنك كلما اقتربت منه؟', answer: 'الأفق' },
        { question: 'ما هو الشيء الذي له رقبة بلا رأس？', answer: 'زجاجة' },
        { question: 'ما هو الشيء الذي إذا حذفت أوله صار اسم فاكهة？', answer: 'تفاح' },
        { question: 'ما هو الشيء الذي كلما زاد وزنه نقص سعره？', answer: 'نحاس' },
        { question: 'ما هو الشيء الذي لا يستفيد منه إلا إذا كسر؟', answer: 'بيضة' },
        { question: 'ما هو الشيء الذي يبكي بلا عين ويطير بلا جناح？', answer: 'سحاب' },
        { question: 'ما هو الشيء الذي له يد ولا يصفق？', answer: 'ساعة' },
        { question: 'ما هو الشيء الذي يجري بلا رجلين？', answer: 'ماء' }
    ]
};

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['لغز'],
    description: '🧠 ألغاز وأسئلة ذكية (الكل يشارك)',
    category: 'فعاليات',
    usage: '.لغز [سهل|متوسط|صعب]',

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
                    '📝 مثال: `.لغز سهل`'
                ], msg);
                return;
            }

            // ===== اختيار لغز عشوائي =====
            const levelRiddles = riddles[inputLevel];
            if (!levelRiddles || levelRiddles.length === 0) {
                await sendMessage(sock, chatId, [
                    '❌ *لا توجد ألغاز في هذا المستوى*',
                    '',
                    '📌 اختر مستوى آخر'
                ], msg);
                return;
            }

            const selected = levelRiddles[Math.floor(Math.random() * levelRiddles.length)];
            const questionText = selected.question;
            const correctAnswer = selected.answer;

            // ===== إرسال التحدي =====
            await sendMessage(sock, chatId, [
                `🧠 *اللغز:*`,
                '',
                `📝 *${questionText}*`,
                '',
                `⏳ *الوقت:* ${timeMap[inputLevel] / 1000} ثواني`,
                `💰 *المكافأة:* +${rewardMap[inputLevel]} نقطة`,
                `⚠️ *العقاب:* -${penaltyMap[inputLevel]} نقطة (للمنشئ فقط)`,
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

                    // ===== مقارنة الإجابة =====
                    if (isMatching(txt, correctAnswer)) {
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
                            `🧠 *اللغز:* ${questionText}`,
                            `✅ *الإجابة:* ${correctAnswer}`,
                            `📊 *المستوى:* ${inputLevel}`,
                            `💰 *المكافأة:* +${rewardMap[inputLevel]} نقطة`,
                            `📈 *رصيدك:* ${formatNumber(points[answerer] || 0)} نقطة`,
                            `🏅 *الرتبة:* ${getLevel(points[answerer] || 0)}`,
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

                // خصم نقاط من المنشئ فقط
                points[sender] = (points[sender] || 0) - penaltyMap[inputLevel];
                saveJSON(pointsPath, points);

                await sendMessage(sock, chatId, [
                    '⏰ *انتهى الوقت!*',
                    '',
                    `🧠 *اللغز:* ${questionText}`,
                    `✅ *الإجابة الصحيحة:* ${correctAnswer}`,
                    `📊 *المستوى:* ${inputLevel}`,
                    `➖ *تم خصم:* ${penaltyMap[inputLevel]} نقطة من المنشئ`,
                    `📈 *رصيد المنشئ:* ${formatNumber(points[sender] || 0)} نقطة`,
                    `🏅 *رتبة المنشئ:* ${getLevel(points[sender] || 0)}`,
                    `👤 *المنشئ:* @${senderNum}`
                ], null, [sender]);

            }, timeMap[inputLevel]);

        } catch (error) {
            console.error('❌ خطأ في أمر لغز:', error);
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