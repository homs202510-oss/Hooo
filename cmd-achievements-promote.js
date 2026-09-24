const ranks = require('./mod-ranks');
const user = require('./mod-user');

function bar(p, t) {
    const percent = Math.min(100, Math.floor((p / t) * 100));
    const filled = Math.floor(percent / 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

module.exports = {
    name: 'ترقية',
    aliases: ['promote'],
    desc: 'ترقية للرتبة التالية',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        const result = ranks.canPromote(ctx.sender);

        if (result.reason === 'max') {
            return ctx.card('👑 الترقية', [
                { emoji: '💎', title: 'وصلت لأعلى رتبة', content: 'انت إمبراطور PHANTOM!' },
            ]);
        }

        if (!result.ok) {
            const checkList = result.checks.map(c => {
                const mark = c.met ? '✅' : '❌';
                const b = bar(c.current, c.required);
                return `${mark} ${c.label}\n     ${b} ${c.current.toLocaleString('ar-EG')} / ${c.required.toLocaleString('ar-EG')}`;
            }).join('\n\n');

            return ctx.card(`⬆️ الترقية القادمة: ${result.next.name}`, [
                { emoji: '📊', title: 'الشروط', content: checkList },
                { emoji: '❌', title: 'الحالة', content: 'لم تكتمل الترقية بعد' },
            ]);
        }

        // الترقية
        const promo = ranks.promote(ctx.sender);
        if (!promo.ok) return ctx.error('فشلت الترقية');

        await ctx.card('🎉 تمت الترقية!', [
            { emoji: '👑', title: 'الرتبة الجديدة', content: promo.rank.name },
            { emoji: promo.rank.color, title: 'المستوى', content: `رقم ${promo.rank.id} من 8` },
            { emoji: '✨', title: 'مبروك', content: 'استمر — الرتب الأعلى أقوى' },
        ]);
    }
};
