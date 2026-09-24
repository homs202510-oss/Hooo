/**
 * 👻 .مساعدة_[قسم] — مساعدة ديناميكية
 */
const topics = require('./data-help-topics');
const user = require('./mod-user');
const kd = require('./mod-kingdom');
const mil = require('./mod-military');

const TOPIC_MAP = {
    'مملكة': 'مملكة', 'جيش': 'جيش', 'اقتصاد': 'اقتصاد', 'سوق': 'سوق',
    'مهام': 'مهام', 'رتب': 'رتب', 'صناعة': 'صناعة', 'ai': 'ai',
    'جروبات': 'جروبات', 'أدوات': 'أدوات', 'ادوات': 'أدوات',
};

function buildContext(jid) {
    const u = user.getOrCreate(jid);
    const k = kd.getKingdom(jid);
    const hasKingdom = !!k;
    const hasBarracks = k ? kd.getBuildings(k.id).some(b => b.building_type === 'ثكنة') : false;
    const hasArmy = k ? mil.getArmyCount(k.id) > 0 : false;
    return { u, k, hasKingdom, hasBarracks, hasArmy };
}

function personalizedTip(topic, ctx) {
    // رسالة ذكية حسب حالة اللاعب
    switch (topic) {
        case 'جيش':
            if (!ctx.hasKingdom) return { emoji: '💡', title: 'خطوتك الأولى', content: 'أنشئ مملكة الأول بـ .إنشاء [اسم]' };
            if (!ctx.hasBarracks) return { emoji: '💡', title: 'الخطوة التالية', content: 'ابنِ ثكنة بـ .بناء ثكنة' };
            if (!ctx.hasArmy) return { emoji: '💡', title: 'جاهز!', content: 'ابدأ التجنيد بـ .تجنيد مشاة 10' };
            return null;
        case 'مملكة':
            if (!ctx.hasKingdom) return { emoji: '💡', title: 'خطوتك الأولى', content: 'ابدأ بـ .إنشاء [اسم المملكة]' };
            return null;
        default:
            return null;
    }
}

module.exports = Object.entries(TOPIC_MAP).map(([key, topicKey]) => ({
    name: `مساعدة_${key}`,
    aliases: [`help_${key}`, `help${key}`],
    desc: `مساعدة ${topicKey}`,
    async run(ctx) {
        const topic = topics[topicKey];
        if (!topic) return ctx.error('قسم غير معروف');

        const playerCtx = buildContext(ctx.sender);
        const blocks = [];

        // عنوان
        blocks.push({
            emoji: topic.emoji,
            title: topic.title,
            content: topic.desc,
        });

        // أقسام الموضوع
        for (const sec of topic.sections) {
            blocks.push({ emoji: sec.emoji, title: sec.title, content: sec.content });
        }

        // نصيحة شخصية
        const tip = personalizedTip(topicKey, playerCtx);
        if (tip) blocks.push(tip);

        // رجوع
        blocks.push({ emoji: '💡', title: 'للرجوع', content: '.مساعدة — قائمة الأقسام\n.اوامر — كل الأوامر' });

        await ctx.card(`مساعدة — ${topic.title}`, blocks);
    }
}));
