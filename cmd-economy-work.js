const user = require('./mod-user');
const tracker = require('./mod-tracker');

const COOLDOWN_MS = 60 * 60 * 1000;
const JOBS = [
    { name: 'مزارع 🌾',  min: 150, max: 250 },
    { name: 'تاجر 💼',    min: 180, max: 300 },
    { name: 'حداد 🔨',    min: 160, max: 280 },
    { name: 'صياد 🎣',    min: 140, max: 260 },
    { name: 'حارس 🛡️',   min: 130, max: 240 },
    { name: 'عامل 👷',    min: 120, max: 220 },
    { name: 'نجار 🪚',    min: 150, max: 270 },
    { name: 'مناجم ⛏️',  min: 200, max: 350 },
];

function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}د ${s % 60}ث`;
}

module.exports = {
    name: 'عمل',
    aliases: ['work', 'اشتغل'],
    desc: 'اشتغل واكسب فلوس',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const now = Date.now();
        const lastWork = user.getCooldown(ctx.sender, 'last_work');
        const elapsed = now - lastWork;

        if (lastWork > 0 && elapsed < COOLDOWN_MS) {
            const remaining = COOLDOWN_MS - elapsed;
            return ctx.card('العمل', [
                { emoji: '😮‍💨', title: 'انت تعبان', content: ' ارتاح شوية' },
                { emoji: '🕒', title: 'المتبقي', content: ` ${formatTime(remaining)}` },
            ]);
        }

        const job = JOBS[Math.floor(Math.random() * JOBS.length)];
        const salary = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
        const xpGain = 15 + Math.floor(Math.random() * 16); // 15-30

        const newBalance = user.addCoins(ctx.sender, salary);
        user.setCooldown(ctx.sender, 'last_work', now);
        const result = user.addXP(ctx.sender, xpGain);
        tracker.track(ctx.sender, 'work_count', 1);

        const levelMsg = result && result.leveledUp ? `\n     🎉 *ارتقيت للمستوى ${result.level}!*` : '';

        await ctx.card('العمل', [
            { emoji: '💼', title: 'الوظيفة', content: ` ${job.name}` },
            { emoji: '💰', title: 'الأجر', content: ` +${salary} 🪙` },
            { emoji: '⭐', title: 'XP', content: ` +${xpGain}${levelMsg}` },
            { emoji: '🏦', title: 'الرصيد الجديد', content: ` ${newBalance} 🪙` },
        ]);
    }
};
