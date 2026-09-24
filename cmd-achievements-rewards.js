const ach = require('./mod-achievements');
const user = require('./mod-user');

module.exports = {
    name: 'جوائز',
    aliases: ['rewards', 'جوايز'],
    desc: 'استلام جوائز الإنجازات',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        ach.updateAll(ctx.sender);
        const list = ach.getList(ctx.sender);

        const toClaim = list.unlocked.filter(x => !x.claimed);

        if (!toClaim.length) {
            return ctx.card('🎁 الجوائز', [
                { emoji: '💭', title: 'مفيش جوائز', content: 'لسه مفتحتش إنجازات جديدة' },
                { emoji: '💡', title: 'ابدأ', content: '.إنجازات — لعرض الإنجازات' },
            ]);
        }

        const results = [];
        for (const x of toClaim) {
            const res = ach.claim(ctx.sender, x.achievement.id);
            if (res.ok) {
                const line = [];
                if (res.rewards.coins) line.push(`💰 ${res.rewards.coins.toLocaleString('ar-EG')}`);
                if (res.rewards.xp) line.push(`✨ ${res.rewards.xp} XP`);
                if (res.achievement.title) line.push(`🏷️ ${res.achievement.title}`);
                results.push(`✅ *${res.achievement.name}*\n     ${line.join(' | ')}`);
            }
        }

        if (!results.length) return ctx.error('فشل استلام الجوائز');

        const newBal = user.getCoins(ctx.sender);

        await ctx.card('🎁 جوائز مستلمة', [
            { emoji: '🏆', title: `العدد: ${results.length}`, content: results.join('\n\n') },
            { emoji: '💼', title: 'رصيدك الجديد', content: `${newBal.toLocaleString('ar-EG')} 🪙` },
        ]);
    }
};
