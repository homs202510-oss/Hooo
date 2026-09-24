/**
 * 👻 .دليل — Tutorial تفاعلي
 */
const kd = require('./mod-kingdom');
const user = require('./mod-user');

module.exports = {
    name: 'دليل',
    aliases: ['tutorial'],
    desc: 'دليل البداية',
    async run(ctx) {
        const u = user.getOrCreate(ctx.sender, ctx.pushName);
        const k = kd.getKingdom(ctx.sender);

        // ═══ لاعب جديد (مفيش مملكة) ═══
        if (!k) {
            return ctx.card('👻 أهلًا بك في PHANTOM', [
                { emoji: '🎯', title: 'خطوتك الأولى', content: 'أنشئ مملكتك!' },
                { emoji: '⌨️', title: 'الأمر', content: '.إنشاء [اسم المملكة]\nمثال: .إنشاء مملكة الشبح' },
                { emoji: '🎁', title: 'هتاخد', content: '🪵 1000 خشب\n🪨 1000 حجر\n🌾 1000 قمح\n🪙 500 ذهب\n⛏️ 100 حديد' },
                { emoji: '💡', title: 'بعد كده', content: '.اوامر 5 — قسم المملكة\nأو كمل الخطوات' },
            ]);
        }

        // ═══ لاعب عنده مملكة، مفيش مباني ═══
        const buildings = kd.getBuildings(k.id);
        if (!buildings.length) {
            return ctx.card('👻 الخطوة التالية', [
                { emoji: '🏗️', title: 'ابنِ أول مبنى', content: 'المباني بتزود إنتاجك وقوتك' },
                { emoji: '⌨️', title: 'الأوامر', content: '.بناء — قائمة المباني\n.بناء مزرعة — ينتج قمح\n.بناء منجم — ينتج حديد' },
                { emoji: '💡', title: 'بعد البناء', content: '.جمع — تجمع الإنتاج\n.إنتاج — تعرف معدلك' },
            ]);
        }

        // ═══ لاعب عنده مبنى، مفيش ثكنة ═══
        const hasBarracks = buildings.some(b => b.building_type === 'ثكنة');
        if (!hasBarracks) {
            return ctx.card('👻 الخطوة التالية', [
                { emoji: '⚔️', title: 'ابنِ ثكنة', content: 'الثكنة بتفتح الجيش' },
                { emoji: '⌨️', title: 'الأمر', content: '.بناء ثكنة' },
                { emoji: '💡', title: 'بعد الثكنة', content: '.تجنيد — تبدأ الجيش\n.تدريب — تقوّيه' },
            ]);
        }

        // ═══ لاعب عنده ثكنة، مفيش جيش ═══
        const mil = require('./mod-military');
        const armyCount = mil.getArmyCount(k.id);
        if (armyCount === 0) {
            return ctx.card('👻 الخطوة التالية', [
                { emoji: '⚔️', title: 'جنّد أول جندي', content: 'الجيش بيحميك ويهجم' },
                { emoji: '⌨️', title: 'الأمر', content: '.تجنيد — قائمة الوحدات\n.تجنيد مشاة 10' },
                { emoji: '💡', title: 'بعد التجنيد', content: '.جيش — تعرض جيشك\n.تدريب مشاة — ترفع مستواه' },
            ]);
        }

        // ═══ لاعب عنده كل حاجة ═══
        return ctx.card('👻 أنت جاهز!', [
            { emoji: '✅', title: 'أساسياتك كاملة', content: 'مملكة ✅\nمباني ✅\nجيش ✅' },
            { emoji: '🎯', title: 'الخطوات المتقدمة', content: '1. .مهام — ابدأ المهام\n2. .استكشاف — فتح المناطق\n3. .تحالف — دبلوماسية\n4. .حرب — معارك\n5. .إنجازات — تحديات' },
            { emoji: '📚', title: 'تعلم أكثر', content: '.مساعدة — أقسام المساعدة\n.اوامر — كل الأوامر' },
        ]);
    }
};
