const kd = require('./mod-kingdom');
const mil = require('./mod-military');
const user = require('./mod-user');
const tracker = require('./mod-tracker');

module.exports = {
    name: 'تدريب',
    aliases: ['train'],
    desc: 'تدريب الجيش',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const k = kd.getKingdom(ctx.sender);
        if (!k) return ctx.error('محتاج تنشئ مملكة الأول');

        const type = ctx.args[0];

        if (!type) {
            const army = kd.getArmy(k.id);
            if (!army.length) {
                return ctx.card('🎯 التدريب', [
                    { emoji: '🪖', title: 'مفيش جيش', content: '.تجنيد مشاة 10' },
                ]);
            }
            const list = army.map(u => {
                const info = mil.UNIT_TYPES[u.type] || kd.getArmyInfo(u.type);
                const canLevel = (u.level || 1) < mil.MAX_UNIT_LEVEL;
                const status = canLevel ? `Lv.${u.level || 1} → XP ${u.experience || 0}/${mil.XP_PER_LEVEL}` : '✅ Max';
                return `${info.emoji || '⚔️'} *${u.type}* × ${u.count}\n     ${status}`;
            }).join('\n\n');
            return ctx.card('🎯 تدريب الجيش', [
                { emoji: '🪖', title: 'الوحدات', content: list },
                { emoji: '💡', title: 'الطريقة', content: '.تدريب [النوع]' },
            ]);
        }

        if (!mil.UNIT_TYPES[type]) return ctx.error(`نوع "${type}" مش معروف`);

        const result = mil.train(k.id, ctx.sender, type);
        if (!result.ok) {
            if (result.reason === 'no_units') return ctx.error(`مفيش "${type}"`);
            if (result.reason === 'max_level') return ctx.error('وصل لأقصى مستوى');
            if (result.reason === 'no_food') return ctx.error(`محتاج ${result.need} طعام`);
            if (result.reason === 'no_coins') return ctx.error(`محتاج ${result.need} 🪙`);
            return ctx.error('فشل التدريب');
        }

        tracker.track(ctx.sender, 'train_count', 1);
        const xpResult = user.addXP(ctx.sender, 15);
        const def = mil.UNIT_TYPES[type];

        await ctx.card('🎯 تم التدريب', [
            { emoji: def.emoji, title: type, content: `Lv.${result.level}` },
            { emoji: '💸', title: 'التكلفة', content: `🍖 ${result.foodCost} + ${result.coinsCost} 🪙` },
            { emoji: '⭐', title: 'XP', content: `+15` },
        ]);
    }
};
