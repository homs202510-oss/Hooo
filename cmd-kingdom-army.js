const kd = require('./mod-kingdom');
const mil = require('./mod-military');
const user = require('./mod-user');

module.exports = {
    name: 'جيش',
    aliases: ['army'],
    desc: 'عرض الجيش',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const k = kd.getKingdom(ctx.sender);
        if (!k) return ctx.error('محتاج تنشئ مملكة الأول');

        const army = kd.getArmy(k.id);
        const stats = kd.getArmyStats(k.id);
        const max = kd.getMaxArmy(k.id);
        const current = kd.getArmyCount(k.id);

        if (!army.length) {
            return ctx.card('الجيش', [
                { emoji: '⚔️', title: 'مفيش جيش', content: 'لسه مجنّدتش أي وحدات' },
                { emoji: '💡', title: 'ابدأ', content: '.تجنيد' },
            ]);
        }

        const armyContent = army.map(a => {
            // ✅ دعم UNIT_TYPES + ARMY_TYPES
            const info = mil.UNIT_TYPES[a.soldier_type] || kd.getArmyInfo(a.soldier_type);
            return `${info.emoji || '⚔️'} ${a.soldier_type} : ${a.count}`;
        }).join('\n');

        await ctx.card('الجيش', [
            { emoji: '⚔️', title: `الجنود (${current}/${max})`, content: armyContent },
            { emoji: '🗡️', title: 'إجمالي الهجوم', content: `${stats.attack.toLocaleString('ar-EG')}` },
            { emoji: '🛡️', title: 'إجمالي الدفاع', content: `${stats.defense.toLocaleString('ar-EG')}` },
        ]);
    }
};
