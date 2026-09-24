// تخمين.js - لعبة تخمين شخصية الأنمي من الوصف (نسخة موسعة)

const fs = require('fs');
const path = require('path');

const ranksFile = path.join(__dirname, 'db-ranks.json');
const pointsPath = path.join(__dirname, 'db-points.json');
const games = new Map();

if (!fs.existsSync(ranksFile)) fs.writeFileSync(ranksFile, JSON.stringify({}, null, 2));
if (!fs.existsSync(pointsPath)) fs.writeFileSync(pointsPath, JSON.stringify({}, null, 2));

// ========== دوال مساعدة ==========
function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file)); } 
    catch { return {}; }
}
function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
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

function getLevel(points) {
    if (points >= 1000000000) return '👑 DEVELOPER';
    if (points >= 100000000) return '🌀 KING OF POINTS';
    if (points >= 10000000) return '💀 BIG BOSS';
    if (points >= 1000000) return '🔥🔥 WTF';
    if (points >= 100000) return '🔪🩸 KILLER';
    if (points >= 10000) return '🦁 LEGEND';
    if (points >= 1000) return '💎 PRO';
    if (points >= 500) return '🔥 ADVANCED';
    if (points >= 200) return '🌱 JUNIOR';
    return '🙂 BEGINNER';
}

// ========== دالة الإرسال ==========
async function sendMessage(sock, chatId, lines, quoted = null, mentions = []) {
    if (!Array.isArray(lines)) {
        lines = [lines];
    }

    let msg = `🧠 لـعـبـة الـتـخـمـيـن 🧠\n`;
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

// ========== قوائم الشخصيات الموسعة ==========
const characters = {
    سهل: [
        // ناروتو
        { name: "ناروتو", hint: "نينجا يحب الرامن ويملك الكيوبي بداخله." },
        { name: "ساكورا", hint: "الفتاة الوحيدة في فريق ناروتو الأصلي." },
        { name: "ساسكي", hint: "ينتمي لعشيرة الأوتشيها، يسعى للانتقام." },
        { name: "كاكاشي", hint: "مدرب الفريق السابع، يقرأ كتابًا دائمًا." },
        { name: "إيتاتشي", hint: "أوتشيها قتل عشيرته لأجل السلام." },
        { name: "هيناتا", hint: "خجولة، تحب ناروتو، من عشيرة هيوغا." },
        { name: "غارا", hint: "كان عدواً لناروتو وأصبح كازيكاغي." },
        { name: "تسونادي", hint: "الهوكاجي الخامس، قوية وتحب القمار." },
        { name: "جيرايا", hint: "أحد السانين الأسطوريين، يدرب ناروتو." },
        { name: "روك لي", hint: "لا يستخدم النينجتسو بل التايجتسو فقط." },
        { name: "نيجي", hint: "عبقري من عشيرة هيوغا." },
        { name: "شينو", hint: "يتحكم بالحشرات ويحب الهدوء." },
        { name: "كيبا", hint: "يقاتل بجانب كلبه أكامارو." },
        { name: "تشوجي", hint: "يحب الأكل ويقاتل بجسمه الضخم." },
        { name: "ساي", hint: "فنان وقاتل محترف في الفريق السابع." },
        // ون بيس
        { name: "لوفي", hint: "يملك جسد مطاطي ويحلم بأن يكون ملك القراصنة." },
        { name: "زورو", hint: "مبارز بثلاث سيوف، يتبع لوفي." },
        { name: "سانجي", hint: "طباخ القراصنة، يقاتل برجليه." },
        { name: "نامي", hint: "ترسم الخرائط وتحب المال." },
        { name: "تشوبر", hint: "غزال يتحول إلى إنسان." },
        { name: "يوسوب", hint: "قناص جبان لكنه شجاع عند الحاجة." },
        { name: "فرانكي", hint: "سايبورغ يبني السفن." },
        { name: "بروك", hint: "هيكل عظمي موسيقي." },
        { name: "روبن", hint: "تبحث عن الحقيقة، تملك يدًا في كل مكان." },
        // هنتر
        { name: "غون", hint: "فتى مغامر يبحث عن والده." },
        { name: "كيلوا", hint: "صديق غون، قاتل محترف سابقًا." },
        { name: "كورابيكا", hint: "يسعى للانتقام لعشيرته." },
        { name: "ليوريو", hint: "يريد أن يصبح طبيبًا." },
        { name: "هيسوكا", hint: "مهرج مخيف يعشق القتال." },
        // دراغون بول
        { name: "غوكو", hint: "محارب سايان، يحب القتال والأكل." },
        { name: "فيجيتا", hint: "أمير السايانز، فخور جداً." },
        { name: "بيكولو", hint: "محارب أخضر، كان عدواً ثم أصبح صديقاً." },
        // بليتش
        { name: "إيتشيغو", hint: "يقاتل الأرواح الشريرة بسيفه الكبير." },
        { name: "روكيا", hint: "منحت قوتها لإيتشيغو في البداية." },
        // جوجوتسو
        { name: "إيتادوري", hint: "ابتلع إصبع السوكونا ليصبح وعاءً للشيطان." },
        { name: "ميغومي", hint: "يستدعي وحوش ظل للقتال." },
        { name: "نوبارا", hint: "تستخدم المطرقة والمسامير." },
        { name: "تودو", hint: "قوي، يحب الفتيات الجميلات." },
        // ماي هيرو
        { name: "ميدوريا", hint: "يريد أن يكون بطلًا، ورث القوة من أول مايت." },
        { name: "باكوغو", hint: "غاضب دائمًا ويملك تفجيرات." },
        { name: "تودوروكي", hint: "نصف نار ونصف جليد." },
        { name: "أوراراكا", hint: "تجعل الأشياء تطفو." },
        { name: "أول مايت", hint: "البطل رقم 1 سابقاً." },
        // قاتل الشياطين
        { name: "تانجيرو", hint: "قاتل شياطين، يشم الروائح لتحديد الأعداء." },
        { name: "نيزوكو", hint: "أخت تانجيرو التي تحولت إلى شيطانة." },
        { name: "زينيتسو", hint: "جبان لكنه قوي جداً عندما ينام." },
        { name: "إنوسوكي", hint: "يرتدي قناع خنزير بري، يحارب بشدة." },
        // أبطال خارقون
        { name: "سايتاما", hint: "أصلع، يستطيع هزيمة أي عدو بلكمة واحدة." },
        { name: "جينوس", hint: "سايبورغ، تلميذ سايتاما." },
        // بيرسيرك
        { name: "غوتس", hint: "محارب يحمل سيفاً ضخماً، يسعى للانتقام." },
        // فينلاند ساغا
        { name: "ثورفين", hint: "محارب شاب يسعى للانتقام من قاتل والده." },
        // إضافات جديدة
        { name: "كوروسينسي", hint: "معلم فضاء يخطط لتدمير الأرض." },
        { name: "ناغيسا", hint: "فتاة ذات قدرات قاتلة لكنها هادئة." },
        { name: "كارما", hint: "طالب مشاغب لكنه عبقري." },
        { name: "كاتسوكي", hint: "طالب من الطبقة الأولى، قوي جداً." },
        { name: "شوتو", hint: "مشهور ووسيم، يستخدم الكرة." },
        { name: "هيناتا", hint: "لاعب كرة طائرة صغير الحجم لكنه سريع." },
        { name: "كاغيما", hint: "موزع عبقري في هايكيو." },
        { name: "تسوكيشيما", hint: "هادئ ويملك دقة عالية في التوزيع." },
        { name: "نيشينويا", hint: "ليبيرو فريق كاراسونو، قصير لكن مرن." },
        { name: "ساوامورا", hint: "قائد الفريق بروح قتالية عالية." },
        { name: "أويشا", hint: "قائد فريق شيريتوريزاوا." },
        { name: "ساكورا", hint: "من فريق أواجي، شغوف ومخلص." },
        { name: "أراكي", hint: "من فريق أواجي، شغوف ومخلص." },
        { name: "هيناتا", hint: "من فريق أواجي، شغوف ومخلص." },
        { name: "كاجي", hint: "من فريق أواجي، شغوف ومخلص." },
        { name: "موتشيزوكي", hint: "من فريق أواجي، شغوف ومخلص." },
        { name: "ساكورا", hint: "من فريق أواجي، شغوف ومخلص." },
        { name: "أوكومورا", hint: "طالب في نانتشي، يحب الرماية." },
        { name: "ساكاموتو", hint: "من فريق أواجي، شغوف ومخلص." },
        { name: "شيمورا", hint: "من فريق أواجي، شغوف ومخلص." },
        { name: "تاكاهاشي", hint: "من فريق أواجي، شغوف ومخلص." }
    ],
    متوسط: [
        // ناروتو
        { name: "كيميمارو", hint: "يقاتل باستخدام عظامه، آخر من عشيرته." },
        { name: "أنكو", hint: "تلميذة أوروتشيمارو وتستخدم الأفاعي." },
        { name: "كارين", hint: "تستخدم الشفاء عبر العض، تحب ساسكي." },
        { name: "سويغيتسو", hint: "يسعى لجمع سيوف الضباب السبعة، يتحول لماء." },
        { name: "زيتسو", hint: "نصف أبيض ونصف أسود، يتجسس ويتسلل." },
        { name: "ميناتو", hint: "الأب الخارق، الهوكاجي الرابع." },
        { name: "كوشينا", hint: "أم ناروتو، صاحبة الكيوبي السابقة." },
        { name: "شيسوي", hint: "أوتشيها يملك أقوى وهم." },
        { name: "أوبيتو", hint: "صديق كاكاشي، تحول لعدو." },
        { name: "كونان", hint: "تنتمي لأكاتسوكي، تستخدم الورق." },
        { name: "باين", hint: "قائد الأكاتسوكي الظاهري." },
        { name: "ديدارا", hint: "يحب التفجيرات والفن." },
        { name: "ساسوري", hint: "دمية بشرية قاتلة." },
        { name: "كاكوزو", hint: "يملك قلوب متعددة." },
        // ون بيس
        { name: "سابو", hint: "أخ لوفي بالتبني، يستخدم النار." },
        { name: "إينيل", hint: "إله سكايبيا، يستخدم البرق." },
        { name: "كوزان", hint: "أدميرال سابق يتحكم بالجليد." },
        { name: "هانكوك", hint: "جميلة تحول الناس لحجر." },
        { name: "لوتشي", hint: "قاتل محترف من CP9، يستخدم النمر." },
        { name: "كاكو", hint: "يقاتل بالسيف على قدمين، يتحول لزرافة." },
        { name: "ماجيلان", hint: "يحكم الإمبل داون، يستخدم السم." },
        { name: "إيفانكوف", hint: "يغير الجنس بهرمونات." },
        { name: "باجي", hint: "ينقسم إلى قطع ولا يُقطع." },
        { name: "مستر 2", hint: "يغير شكله ويقلد الآخرين." },
        // خطايا السبع
        { name: "بان", hint: "خالد من الخطايا السبعة." },
        { name: "ميرلين", hint: "ساحرة عبقرية." },
        { name: "إسكانور", hint: "أقوى رجل وقت الظهيرة." },
        { name: "زيردريس", hint: "أخ ميليوداس، قائد الشياطين." },
        // جوجوتسو
        { name: "توغي", hint: "كلامه ملعون، يستخدم أوامر بالكلمات." },
        { name: "باندا", hint: "باندا مقاتل، ليس حقيقياً." },
        { name: "ماكي", hint: "من عشيرة قوية رغم عدم امتلاكها للطاقة الملعونة." },
        // بوكو نو هيرو
        { name: "شينسو", hint: "يستطيع التحكم بالعقول." },
        { name: "دابي", hint: "يحترق، ويخفي أسراراً." },
        { name: "هيميكو", hint: "فتاة مجنونة في My Hero." },
        { name: "توغا", hint: "تعشق الدم، تنتمي للأشرار." },
        // بليتش
        { name: "أوراهارا", hint: "بائع غامض لكنه قوي وذكي." },
        { name: "ياماموتو", hint: "أقوى قائد في مجتمع الأرواح." },
        { name: "بيتشر", hint: "قاتل محترف من مجتمع الأرواح." },
        // أبطال خارقون
        { name: "غارو", hint: "بطل سابق، تحول إلى وحش خارق." },
        { name: "فيورن", hint: "شخصية غامضة تسعى للقوة." },
        // دراغون بول
        { name: "فريزر", hint: "شرير فضائي يخاف منه الجميع." },
        { name: "سيل", hint: "مخلوق مثالي مصنوع من أقوى المحاربين." },
        // ديث نوت
        { name: "لايت", hint: "طالب عبقري يملك دفتر موت." },
        { name: "إل", hint: "أعظم محقق في العالم." },
        { name: "ميسا", hint: "فتاة تحب لايت، تملك عيون شينيغامي." },
        // فول ميتال
        { name: "إدوارد", hint: "كيميائي عسكري، فقد ذراعه ورجله." },
        { name: "ألفونس", hint: "روح داخل درع، بحثاً عن جسده." },
        // هجوم العمالقة
        { name: "إرين", hint: "يتحول إلى عملاق ويحارب ضدهم." },
        { name: "ميكاسا", hint: "تحمي إرين دائمًا، قوية جدًا." },
        { name: "أرمين", hint: "ذكي جدًا رغم ضعفه البدني." },
        { name: "ليفاي", hint: "أقوى جندي بشري ضد العمالقة." },
        // قاتل الشياطين
        { name: "رينغوكو", hint: "قاتل شياطين يستخدم النار، شغوف جداً." },
        { name: "توميوكا", hint: "قاتل شياطين يستخدم الماء، هادئ." },
        { name: "شينوبو", hint: "قاتلة شياطين تستخدم السم، دائماً مبتسمة." },
        // إضافات جديدة
        { name: "أوكارون", hint: "من دراغون بول، مخلص لغوكو." },
        { name: "شيا", hint: "أميرة من دراغون بول سوبر." },
        { name: "كابا", hint: "من جوجوتسو، كرة الظل." },
        { name: "سيشون", hint: "من جوجوتسو، كرة الظل." },
        { name: "موراكامي", hint: "من جوجوتسو، كرة الظل." },
        { name: "نارومي", hint: "من جوجوتسو، كرة الظل." },
        { name: "تاتسومي", hint: "من جوجوتسو، كرة الظل." },
        { name: "يوكي", hint: "من جوجوتسو، كرة الظل." },
        { name: "رين", hint: "من جوجوتسو، كرة الظل." },
        { name: "ساكي", hint: "من جوجوتسو، كرة الظل." },
        { name: "هونوكا", hint: "من جوجوتسو، كرة الظل." }
    ],
    صعب: [
        // ناروتو
        { name: "كاغويا", hint: "أول من امتلك التشاكرا، أم الشينوبي." },
        { name: "أشورا", hint: "ابن حكيم الطرق الستة، سلف عشيرة سينجو." },
        { name: "إندرا", hint: "أول مستخدم للشارينغان، ابن الحكيم." },
        { name: "تونري", hint: "من نسل كاغويا، قاتل هيناتا في القمر." },
        { name: "هامورا", hint: "أخو هاغورومو، ذهب للقمر." },
        { name: "أوبيتو (تين تيلز)", hint: "عندما أصبح الجينشوريكي للعشرة ذيول." },
        { name: "داروي", hint: "يستخدم البرق والماء، أصبح رايكاجي لاحقاً." },
        { name: "راسا", hint: "الكازيكاجي الرابع، والد جارا، يتحكم بالذهب." },
        { name: "كوكو", hint: "الوحش ذو الخمس ذيول، نار وماء." },
        { name: "تشومي", hint: "الوحش ذو السبعة ذيول، يشبه الحشرة الطائرة." },
        { name: "أوتاكاتا", hint: "جينشوريكي الوحش ذو الستة ذيول." },
        { name: "فوو", hint: "الوحش ذو السبعة ذيول، فتاة من الشلال." },
        { name: "هان", hint: "جينشوريكي الوحش ذو الخمسة ذيول، يرتدي درع بخاري." },
        { name: "روشي", hint: "الوحش ذو الأربعة ذيول، يستخدم الحمم." },
        { name: "موموشيكي", hint: "عدو في فيلم بوروتو، يدمج نفسه مع كينشيكي." },
        { name: "شين أوتشيها", hint: "نسخة من تجارب أوروتشيمارو، يملك شارينغان كثيرة." },
        { name: "ميتسوكي", hint: "ابن أوروتشيمارو، نينجا صناعي." },
        { name: "كاوتشي", hint: "يستخدم تقنية الاندماج، مظهره غريب." },
        { name: "كينشيكي", hint: "مرافق أوراشيكي، يستخدم فأس ضخم." },
        { name: "أوراشيكي", hint: "من عشيرة أوتسوتسوكي، يسرق الجِتسو." },
        // ون بيس
        { name: "روكس", hint: "أول ملك قراصنة، شخصية أسطورية." },
        { name: "غارب", hint: "جد لوفي، أقوى محارب بحري." },
        { name: "دراجون", hint: "أخطر ثوري، والد لوفي." },
        { name: "ميهوك", hint: "أقوى مبارز في العالم." },
        { name: "شانكس", hint: "أحد أباطرة البحر، أنقذ لوفي." },
        // بليتش
        { name: "أيزن", hint: "أذكى وأخطر شرير في بليتش." },
        { name: "أوكو", hint: "زعيم الهولوز، قوي جداً." },
        // جوجوتسو
        { name: "سوكونا", hint: "ملك الشياطين، أقوى شيطان في التاريخ." },
        { name: "جوجو ساتورو", hint: "أقوى شخصية في جوجوتسو، يملك العيون الستة." },
        // دراغون بول
        { name: "زينو", hint: "ملك كل الكون، يدمر الكواكب بسهولة." },
        { name: "الوهس", hint: "مرافق زينو، قوي جداً." },
        // هجوم العمالقة
        { name: "إرين (مؤسس)", hint: "آخر من يملك قوة المؤسس، يسيطر على العمالقة." },
        { name: "غريشا", hint: "والد إرين، سرق قوة المؤسس." },
        // فينلاند ساغا
        { name: "ثورز", hint: "أقوى محارب، والد ثورفين." },
        { name: "أشيلاد", hint: "قائد مجموعة الفايكنغ، ذكي وماكر." },
        // إضافات جديدة
        { name: "أوكين", hint: "من بوكو نو هيرو، شرير غامض." },
        { name: "شيتو", hint: "من هجوم العمالقة، جندي مخضرم." },
        { name: "ميري", hint: "من هجوم العمالقة، جندي مخضرم." },
        { name: "غابي", hint: "من هجوم العمالقة، جندي مخضرم." },
        { name: "فالكو", hint: "من هجوم العمالقة، جندي مخضرم." },
        { name: "كولت", hint: "من هجوم العمالقة، جندي مخضرم." },
        { name: "زيك", hint: "من هجوم العمالقة، جندي مخضرم." },
        { name: "بيي", hint: "من هجوم العمالقة، جندي مخضرم." },
        { name: "بوركو", hint: "من هجوم العمالقة، جندي مخضرم." },
        { name: "كروغر", hint: "من هجوم العمالقة، جندي مخضرم." },
        { name: "غريشا", hint: "من هجوم العمالقة، والد إرين." },
        { name: "كارلا", hint: "من هجوم العمالقة، والدة إرين." },
        { name: "هانيس", hint: "من هجوم العمالقة، صديق العائلة." },
        { name: "نيل", hint: "من هجوم العمالقة، جندي مخضرم." }
    ]
};

const rewardMap = { سهل: 50, متوسط: 100, صعب: 200 };
const penaltyMap = { سهل: 50, متوسط: 100, صعب: 200 };
const TIME_LIMIT = 30000;

// ========== الأمر الرئيسي ==========
module.exports = {
    command: ['تخمين'],
    description: '🧠 لعبة تخمين شخصية الأنمي من الوصف',
    category: 'فعاليات',
    usage: '.تخمين [سهل|متوسط|صعب]',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        try {
            const starter = msg.key.participant || msg.key.remoteJid;
            const starterNum = starter.split('@')[0];

            const fullText = msg.message?.conversation || 
                           msg.message?.extendedTextMessage?.text || '';
            const args = fullText.trim().split(/\s+/).slice(1);
            let inputLevel = (args[0]) ? args[0].trim() : 'سهل';

            if (!['سهل', 'متوسط', 'صعب'].includes(inputLevel)) {
                inputLevel = 'سهل';
            }

            if (games.has(chatId)) {
                await sendMessage(sock, chatId, [
                    '⚠️ *يوجد لعبة نشطة*',
                    '',
                    '📌 انتظر حتى تنتهي اللعبة الحالية',
                    '📌 أو اكتب "انسحب" للانسحاب'
                ], msg);
                return;
            }

            const levelCharacters = characters[inputLevel];
            if (!levelCharacters || levelCharacters.length === 0) {
                await sendMessage(sock, chatId, [
                    '❌ *لا توجد شخصيات في هذا المستوى*',
                    '',
                    '📌 اختر مستوى آخر: سهل، متوسط، صعب'
                ], msg);
                return;
            }

            const chosen = levelCharacters[Math.floor(Math.random() * levelCharacters.length)];
            const correctAnswer = chosen.name.trim().toLowerCase();
            let ended = false;
            let timer = null;

            games.set(chatId, { active: true, starter, level: inputLevel });

            await sendMessage(sock, chatId, [
                `🧠 *خمن الشخصية من الوصف*`,
                '',
                `📊 *المستوى:* ${inputLevel}`,
                `📝 *الوصف:* ${chosen.hint}`,
                '',
                `⏳ *الوقت:* ${TIME_LIMIT / 1000} ثانية`,
                `💰 *المكافأة:* +${rewardMap[inputLevel]} نقطة`,
                `⚠️ *العقاب:* -${penaltyMap[inputLevel]} نقطة`,
                `👤 *السائل:* @${starterNum}`
            ], msg, [starter]);

            const handler = async ({ messages }) => {
                for (const m of messages) {
                    if (ended) return;
                    if (m.key.remoteJid !== chatId) continue;
                    if (m.key.fromMe) continue;

                    const txt = m.message?.conversation || 
                               m.message?.extendedTextMessage?.text || '';
                    if (!txt) continue;

                    const guess = txt.trim().toLowerCase();

                    if (guess === 'انسحب' || guess === 'انسحاب') {
                        const participant = m.key.participant || m.key.remoteJid;
                        if (participant === starter) {
                            ended = true;
                            clearTimeout(timer);
                            sock.ev.off('messages.upsert', handler);
                            games.delete(chatId);

                            const points = loadJSON(pointsPath);
                            const penaltyAmount = Math.min(penaltyMap[inputLevel], points[starter] || 0);
                            points[starter] = (points[starter] || 0) - penaltyAmount;
                            saveJSON(pointsPath, points);

                            await sendMessage(sock, chatId, [
                                '🚪 *انسحبت من اللعبة*',
                                '',
                                `📌 تم خصم ${penaltyAmount} نقطة`,
                                `📊 رصيدك: ${formatNumber(points[starter] || 0)} نقطة`
                            ], m, [starter]);
                            return;
                        } else {
                            await sendMessage(sock, chatId, [
                                '⚠️ *صاحب اللعبة فقط*',
                                '',
                                '📌 يمكن لصاحب اللعبة فقط الانسحاب'
                            ], m);
                            continue;
                        }
                    }

                    if (guess === correctAnswer) {
                        ended = true;
                        clearTimeout(timer);
                        sock.ev.off('messages.upsert', handler);
                        games.delete(chatId);

                        const winner = m.key.participant || m.key.remoteJid;
                        const points = loadJSON(pointsPath);
                        const ranks = loadJSON(ranksFile);

                        points[winner] = (points[winner] || 0) + rewardMap[inputLevel];
                        ranks[winner] = (ranks[winner] || 0) + 1;

                        saveJSON(pointsPath, points);
                        saveJSON(ranksFile, ranks);

                        await sendMessage(sock, chatId, [
                            '🎉 *إجابة صحيحة!* 🎉',
                            '',
                            `🏆 *الفائز:* @${winner.split('@')[0]}`,
                            `🧠 *الشخصية:* ${chosen.name}`,
                            `📊 *المستوى:* ${inputLevel}`,
                            `💰 *المكافأة:* +${rewardMap[inputLevel]} نقطة`,
                            `📈 *رصيدك:* ${formatNumber(points[winner] || 0)} نقطة`,
                            `🏅 *الرتبة:* ${getLevel(points[winner] || 0)}`,
                            `🎖️ *عدد التخمينات الصحيحة:* ${ranks[winner] || 0}`
                        ], m, [winner, starter]);
                        return;
                    }
                }
            };

            sock.ev.on('messages.upsert', handler);

            timer = setTimeout(async () => {
                if (ended) return;
                ended = true;
                sock.ev.off('messages.upsert', handler);
                games.delete(chatId);

                const points = loadJSON(pointsPath);
                const penaltyAmount = Math.min(penaltyMap[inputLevel], points[starter] || 0);
                points[starter] = (points[starter] || 0) - penaltyAmount;
                saveJSON(pointsPath, points);

                await sendMessage(sock, chatId, [
                    '⏰ *انتهى الوقت!*',
                    '',
                    `❌ *الإجابة:* ${chosen.name}`,
                    `📌 تم خصم ${penaltyAmount} نقطة`,
                    `📊 رصيدك: ${formatNumber(points[starter] || 0)} نقطة`
                ], null, [starter]);

            }, TIME_LIMIT);

        } catch (error) {
            console.error('❌ خطأ في لعبة تخمين:', error);
            games.delete(msg.key.remoteJid);
            
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