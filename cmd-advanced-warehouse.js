/**
 * 📦 .مخزن — مخزن المملكة
 */
const wh = require('./mod-warehouse');
const kd = require('./mod-kingdom');
const user = require('./mod-user');

module.exports = {
    name: 'مخزن',
    aliases: ['warehouse'],
    desc: 'مخزن المملكة',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const k = kd.getKingdom(ctx.sender);
        if (!k) return ctx.error('محتاج تنشئ مملكة الأول');

        const w = wh.get(k.id);
        const sub = ctx.args[0];

        // ترقية
        if (sub === 'ترقية' || sub === 'تطوير') {
            const cost = wh.getUpgradeCost(w.level);
            const result = wh.upgrade(k.id);

            if (!result.ok) {
                if (result.reason === 'max_level') return ctx.error('وصل لأقصى مستوى');
                if (result.reason === 'no_gold') return ctx.error(`محتاج ${cost} 🪙 ذهب`);
                return ctx.error('فشل التطوير');
            }

            return ctx.card('✅ تم التطوير', [
                { emoji: '📦', title: 'المستوى الجديد', content: `${result.newLevel}` },
                { emoji: '📊', title: 'السعة الجديدة', content: `${result.newCap.toLocaleString('ar-EG')}` },
                { emoji: '💸', title: 'التكلفة', content: `${cost} 🪙` },
            ]);
        }

        const fillPct = Math.min(100, Math.floor((w.used / w.capacity) * 100));
        const filled = Math.floor(fillPct / 10);
        const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
        const upgradeCost = wh.getUpgradeCost(w.level);

        await ctx.card('📦 مخزن المملكة', [
            { emoji: '📊', title: `المستوى ${w.level}`, content: `${bar} ${fillPct}%` },
            { emoji: '💾', title: 'السعة', content: `${w.used.toLocaleString('ar-EG')} / ${w.capacity.toLocaleString('ar-EG')}` },
            { emoji: '🆓', title: 'المتاح', content: `${w.free.toLocaleString('ar-EG')}` },
            { emoji: '💸', title: 'التطوير القادم', content: w.level >= 20 ? 'وصل لأقصى مستوى' : `${upgradeCost.toLocaleString('ar-EG')} 🪙` },
            { emoji: '💡', title: 'تلميح', content: '.مخزن ترقية' },
        ]);
    }
};
