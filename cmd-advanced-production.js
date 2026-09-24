/**
 * 📈 .إنتاج — الإنتاج والاستهلاك
 */
const prod = require('./mod-production');
const kd = require('./mod-kingdom');
const user = require('./mod-user');

module.exports = {
    name: 'إنتاج',
    aliases: ['production'],
    desc: 'الإنتاج والاستهلاك',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const k = kd.getKingdom(ctx.sender);
        if (!k) return ctx.error('محتاج تنشئ مملكة الأول');

        const net = prod.getNet(k.id);
        const entries = Object.entries(net);

        if (!entries.length) {
            return ctx.card('📈 الإنتاج', [
                { emoji: '💭', title: 'مفيش بيانات', content: 'لسه مفيش إنتاج أو استهلاك' },
            ]);
        }

        const content = entries.map(([res, d]) => {
            const info = kd.RESOURCE_LABELS[res] || { emoji: '📦', name: res };
            const netStr = d.net >= 0 ? `+${d.net}` : `${d.net}`;
            const netEmoji = d.net > 0 ? '🟢' : d.net < 0 ? '🔴' : '⚪';
            return `${info.emoji} *${info.name}*
     ⬆️ إنتاج: +${d.production}/س
     ⬇️ استهلاك: -${d.consumption}/س
     ${netEmoji} الصافي: ${netStr}/س`;
        }).join('\n\n');

        await ctx.card('📈 الإنتاج/ساعة', [
            { emoji: '📊', title: 'التفاصيل', content },
        ]);
    }
};
