const db = require('./core-database');
const user = require('./mod-user');
const guidance = require('./svc-guidance');

const GOALS = {
    army: '⚔️ تكوين الجيش',
    build: '🏗️ بناء مبنى',
    upgrade: '📈 تطوير المملكة',
    market: '🛒 الشراء من السوق',
    war: '🔥 شن حرب',
    explore: '🗺️ استكشاف',
};

module.exports = {
    name: 'تقدم',
    aliases: ['progress'],
    desc: 'تقدمك في الهدف',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        const goals = db.prepare("SELECT * FROM user_goals WHERE user_jid = ? AND status = 'active'").all(ctx.sender);

        if (!goals.length) {
            return ctx.card('📈 التقدم', [
                { emoji: '💭', title: 'مفيش هدف نشط', content: 'حدد هدف الأول' },
                { emoji: '💡', title: 'ابدأ', content: '.هدف — عرض الأهداف\n.هدف army — مثال' },
            ]);
        }

        const blocks = [];
        for (const goal of goals) {
            const g = guidance.guide(ctx.sender, goal.goal_id);
            const total = g.checks.length;
            const met = g.checks.filter(c => c.met).length;
            const percent = Math.floor((met / total) * 100);
            const bar = '█'.repeat(Math.floor(percent / 10)) + '░'.repeat(10 - Math.floor(percent / 10));

            const checklist = g.checks.map(c => {
                const mark = c.met ? '✅' : '❌';
                const name = c.name || c.type;
                const progress = c.required > 1 ? ` (${c.current}/${c.required})` : '';
                return `${mark} ${name}${progress}`;
            }).join('\n');

            blocks.push({
                emoji: '🎯', title: GOALS[goal.goal_id] || goal.goal_id,
                content: `${bar} ${percent}%\n\n${checklist}`
            });

            if (!g.allowed) {
                const firstMissing = g.checks.find(c => !c.met);
                blocks.push({
                    emoji: '💡', title: 'التالي',
                    content: `${firstMissing.hint}\n⌨️ ${g.suggestedCommand}`
                });
            }
        }

        await ctx.card('📈 التقدم', blocks);
    }
};
