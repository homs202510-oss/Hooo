const user = require('./mod-user');

module.exports = {
    name: 'مستوى',
    aliases: ['level', 'lvl'],
    desc: 'عرض المستوى والتقدم',
    async run(ctx) {
        const u = user.getOrCreate(ctx.sender, ctx.pushName);
        const rank = user.getRank(u);
        const nextRank = user.getNextRank(u);

        if (rank.tier === 'owner') {
            return ctx.card('المستوى', [
                { emoji: '⚡', title: 'الرتبة', content: ' أنت المالك — في القمة' },
                { emoji: '📊', title: 'XP', content: ` ${u.xp}` },
            ]);
        }

        const currentRankIdx = user.RANKS.findIndex(r => r.name === rank.name);
        const currentBase = currentRankIdx >= 0 ? user.RANKS[currentRankIdx].minXP : 0;

        let bar, percent, nextInfo;

        if (nextRank) {
            const span = nextRank.minXP - currentBase;
            const gained = u.xp - currentBase;
            percent = Math.min(100, Math.max(0, Math.floor((gained / span) * 100)));
            const filled = Math.floor(percent / 10);
            bar = '▰'.repeat(filled) + '▱'.repeat(10 - filled);
            nextInfo = ` ${nextRank.name}\n يحتاج ${nextRank.minXP - u.xp} XP`;
        } else {
            percent = 100;
            bar = '▰▰▰▰▰▰▰▰▰▰';
            nextInfo = ' وصلت لأعلى رتبة';
        }

        await ctx.card('المستوى', [
            { emoji: '🔰', title: 'الرتبة الحالية', content: ` ${rank.name}` },
            { emoji: '📈', title: 'XP الحالي', content: ` ${u.xp}` },
            { emoji: '🎯', title: 'الرتبة التالية', content: nextInfo },
            { emoji: '💠', title: 'نسبة التقدم', content: ` ${bar} ${percent}%` },
        ]);
    }
};
