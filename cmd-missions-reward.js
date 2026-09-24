const m = require('./mod-missions');
const rewards = require('./mod-rewards');
const user = require('./mod-user');

module.exports = {
    name: 'مكافأة',
    aliases: ['reward'],
    desc: 'استلام مكافأة مهمة',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        const arg = ctx.args[0];

        // ═══ الكود السري ═══
        if (arg && /^[0-9]+$/.test(arg)) {
            const codeResult = rewards.redeem(ctx.sender, arg);
            if (codeResult.ok) {
                const newBal = user.getCoins(ctx.sender);
                return ctx.card('🎁 مكافأة سرية!', [
                    { emoji: '🔐', title: codeResult.name, content: 'تم بنجاح!' },
                    { emoji: '💰', title: 'المكافأة', content: `+${codeResult.coins.toLocaleString('ar-EG')} 🪙` },
                    { emoji: '💼', title: 'رصيدك الجديد', content: `${newBal.toLocaleString('ar-EG')} 🪙` },
                ]);
            }
            if (codeResult.reason === 'used') {
                return ctx.error(`الكود ده استخدمته من قبل`);
            }
            if (codeResult.reason === 'invalid') {
                return ctx.error('كود غير صحيح');
            }
        }

        // ═══ مكافأة مهمة ═══
        const targetId = arg && !isNaN(arg) ? parseInt(arg) : null;

        m.updateProgress(ctx.sender);
        const list = m.getAvailable(ctx.sender);

        if (!list.completed.length) {
            return ctx.card('🎁 المكافآت', [
                { emoji: '💭', title: 'مفيش مكافآت', content: 'لسه مخلّصتش مهام' },
                { emoji: '💡', title: 'ابدأ', content: '.مهام' },
            ]);
        }

        const toClaim = targetId
            ? list.completed.filter(x => x.mission.id === targetId)
            : [list.completed[0]];

        if (!toClaim.length) return ctx.error(`مهمة #${targetId} مش جاهزة للاستلام`);

        const results = [];
        for (const item of toClaim) {
            const res = m.claimReward(ctx.sender, item.mission.id);
            if (res.ok) {
                const r = res.rewards;
                const line = [];
                if (r.coins) line.push(`💰 ${r.coins}`);
                if (r.xp) line.push(`✨ ${r.xp} XP`);
                if (r.resources) for (const [k, v] of Object.entries(r.resources)) line.push(`${k}: ${v}`);
                results.push(`✅ *${item.mission.name}*\n     ${line.join(' | ')}`);
            }
        }

        if (!results.length) return ctx.error('فشل استلام المكافآت');

        const newBal = user.getCoins(ctx.sender);
        await ctx.card('🎁 مكافآت مستلمة', [
            { emoji: '🏆', title: `العدد: ${results.length}`, content: results.join('\n\n') },
            { emoji: '💼', title: 'رصيدك الجديد', content: `${newBal.toLocaleString('ar-EG')} 🪙` },
        ]);
    }
};
