const kd = require('./mod-kingdom');
const dp = require('./mod-diplomacy');
const user = require('./mod-user');

module.exports = {
    name: 'تحالفاتي',
    aliases: ['alliances', 'تحالفات'],
    desc: 'عرض تحالفاتك',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const myK = kd.getKingdom(ctx.sender);

        if (!myK) {
            return ctx.error('محتاج تنشئ مملكة الأول');
        }

        const alliances = dp.getAlliances(myK.id);

        if (!alliances.length) {
            return ctx.card('تحالفاتي', [
                { emoji: '🤝', title: 'مفيش تحالفات', content: 'لسه معندكش أي تحالف' },
                { emoji: '💡', title: 'ابدأ', content: '.تحالف @شخص' },
            ]);
        }

        const content = alliances.map(a => {
            const partnerName = dp.getKingdomName(a.partner_id);
            const date = a.created_at ? new Date(a.created_at * 1000).toLocaleDateString('ar-EG') : 'غير معروف';
            return `${dp.statusLabel(a.status)} *${partnerName}*\n     📅 ${date}`;
        }).join('\n\n');

        await ctx.card('تحالفاتي', [
            { emoji: '🤝', title: `العدد: ${alliances.length}`, content },
        ]);
    }
};
