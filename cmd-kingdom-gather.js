const kd = require('./mod-kingdom');
const user = require('./mod-user');

module.exports = {
    name: 'جمع',
    aliases: ['collect', 'اجمع'],
    desc: 'جمع الموارد المنتجة من المباني',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const k = kd.getKingdom(ctx.sender);

        if (!k) {
            return ctx.card('الجمع', [
                { emoji: '🏰', title: 'مفيش مملكة', content: 'محتاج تنشئ مملكة الأول' },
                { emoji: '💡', title: 'ابدأ', content: '.إنشاء [اسم المملكة]' },
            ]);
        }

        const result = kd.collectProduction(k.id);

        if (!result.ok) {
            if (result.reason === 'too_soon') {
                return ctx.card('الجمع', [
                    { emoji: '⏳', title: 'استنى شوية', content: `لازم تستنى ${result.wait} ثانية كمان` },
                ]);
            }
            return ctx.error('فشل الجمع، حاول تاني');
        }

        const entries = Object.entries(result.gained);
        if (!entries.length) {
            return ctx.card('الجمع', [
                { emoji: '💭', title: 'مفيش إنتاج', content: 'مباني بتنتج موارد كفاية للجمع' },
                { emoji: '💡', title: 'نصيحة', content: 'ابني .بناء مزرعة و .بناء منجم' },
            ]);
        }

        const content = entries
            .map(([type, amount]) => {
                const info = kd.RESOURCE_LABELS[type];
                return `${info.emoji} ${info.name} : +${amount}`;
            }).join('\n');

        const minutes = Math.floor(result.seconds / 60);
        const seconds = result.seconds % 60;
        const timeStr = minutes > 0 ? `${minutes}د ${seconds}ث` : `${seconds}ث`;

        const newRes = kd.getResources(k.id);
        const resNow = Object.entries(kd.RESOURCE_LABELS)
            .map(([type, info]) => `${info.emoji} ${info.name} : ${newRes[type] || 0}`)
            .join('\n');

        await ctx.card('تم الجمع ✅', [
            { emoji: '⏱️', title: 'الفترة', content: timeStr },
            { emoji: '📦', title: 'الموارد المُجمّعة', content },
            { emoji: '💰', title: 'الموارد الحالية', content: resNow },
        ]);
    }
};
