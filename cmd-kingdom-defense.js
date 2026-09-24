const kd = require('./mod-kingdom');
const mil = require('./mod-military');
const stats = require('./mod-stats');
const user = require('./mod-user');

module.exports = {
    name: 'دفاع',
    aliases: ['defense', 'defence'],
    desc: 'عرض تفاصيل الدفاع',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const k = kd.getKingdom(ctx.sender);
        if (!k) return ctx.error('محتاج تنشئ مملكة الأول');

        const s = stats.getKingdomFullStats(k.id);
        const army = mil.getArmy(k.id);

        // تفصيل الدفاع
        let armyDefense = 0;
        for (const u of army) armyDefense += u.defense * u.count;

        const walls = kd.getBuildings(k.id).find(b => b.building_type === 'سور');
        const wallsDefense = walls ? walls.count * walls.level * 20 : 0;

        const itemDefense = s.itemBonuses.defense || 0;
        const allianceBonus = s.allianceBonus.defense;
        const baseDefense = armyDefense + wallsDefense + itemDefense;
        const totalDefense = s.armyStats.defense;

        await ctx.card('🛡️ دفاع المملكة', [
            { emoji: '🛡️', title: 'إجمالي الدفاع', content: `*${totalDefense.toLocaleString('ar-EG')}*` },
            { emoji: '📊', title: 'التفصيل', content:
`🪖 الجيش       : ${armyDefense.toLocaleString('ar-EG')}
🧱 السور        : ${wallsDefense.toLocaleString('ar-EG')}
💎 العناصر      : ${itemDefense.toLocaleString('ar-EG')}
🤝 بونص التحالف : +${Math.floor(allianceBonus * 100)}%` },
            { emoji: '🏰', title: 'مستوى المملكة', content: `${k.level}` },
            { emoji: '👥', title: 'عدد الجنود', content: `${s.armyCount} / ${mil.getMaxArmy(k.id)}` },
            { emoji: '💡', title: 'لتقوية الدفاع', content: '🛡️ جنّد وحدات دفاعية (.تجنيد درع)\n🧱 ابنِ سور (.بناء سور)\n💎 اشترِ دروع من .متجر' },
        ]);
    }
};
