const user = require('./mod-user');
const tracker = require('./mod-tracker');

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const BASE_REWARD = 500;
const BONUS_MAX = 200;

function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}س ${m}د ${s % 60}ث`;
}

module.exports = {
    name: 'يومي',
    aliases: ['daily', 'مكافأة'],
    desc: 'مكافأة يومية',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const now = Date.now();
        const lastDaily = user.getCooldown(ctx.sender, 'last_daily');
        const elapsed = now - lastDaily;

        if (lastDaily > 0 && elapsed < COOLDOWN_MS) {
            const remaining = COOLDOWN_MS - elapsed;
            return ctx.card('المكافأة اليومية', [
                { emoji: '⏳', title: 'لسه بدري', content: ' خدت مكافأتك النهاردة' },
                { emoji: '🕒', title: 'المتبقي', content: ` ${formatTime(remaining)}` },
            ]);
        }

        const bonus = Math.floor(Math.random() * BONUS_MAX);
        const total = BASE_REWARD + bonus;
        const newBalance = user.addCoins(ctx.sender, total);
        user.setCooldown(ctx.sender, 'last_daily', now);
        const result = user.addXP(ctx.sender, 30);

        // ✅ Tracking
        tracker.track(ctx.sender, 'daily_count', 1);

        const levelMsg = result && result.leveledUp ? `\n     🎉 *ارتقيت للمستوى ${result.level}!*` : '';

        await ctx.card('المكافأة اليومية', [
            { emoji: '🎁', title: 'المكافأة', content: ` ${BASE_REWARD} 🪙 أساسي\n +${bonus} 🪙 بونص` },
            { emoji: '💰', title: 'إجمالي', content: ` +${total} 🪙` },
            { emoji: '🏦', title: 'الرصيد الجديد', content: ` ${newBalance} 🪙` },
            { emoji: '⭐', title: 'XP', content: ` +30${levelMsg}` },
        ]);
    }
};
