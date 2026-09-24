const kd = require('./mod-kingdom');
const user = require('./mod-user');

module.exports = {
    name: 'موارد',
    aliases: ['resources'],
    desc: 'عرض موارد المملكة',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const k = kd.getKingdom(ctx.sender);

        if (!k) {
            return ctx.card('الموارد', [
                { emoji: '🏰', title: 'مفيش مملكة', content: 'محتاج تنشئ مملكة الأول' },
                { emoji: '💡', title: 'ابدأ', content: '.إنشاء [اسم المملكة]' },
            ]);
        }

        const res = kd.getResources(k.id);
        const rate = kd.getProductionPerHour(k.id);

        const content = Object.entries(kd.RESOURCE_LABELS)
            .map(([type, info]) => {
                const amount = res[type] || 0;
                const perH = rate[type] || 0;
                const rateStr = perH > 0 ? ` (+${perH}/س)` : '';
                return `${info.emoji} ${info.name.padEnd(6)} : ${amount}${rateStr}`;
            }).join('\n');

        await ctx.card('موارد المملكة', [
            { emoji: '🏰', title: k.name, content: `المستوى ${k.level} • القوة ${k.power}` },
            { emoji: '📦', title: 'الموارد', content },
            { emoji: '💡', title: 'ملاحظة', content: 'استخدم .جمع لتجميع الموارد المنتجة' },
        ]);
    }
};
