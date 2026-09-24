const db = require('./core-database');
const user = require('./mod-user');
const guidance = require('./svc-guidance');

const GOALS = {
    army:     { emoji: '⚔️', name: 'تكوين الجيش' },
    build:    { emoji: '🏗️', name: 'بناء مبنى' },
    upgrade:  { emoji: '📈', name: 'تطوير المملكة' },
    market:   { emoji: '🛒', name: 'الشراء من السوق' },
    war:      { emoji: '🔥', name: 'شن حرب' },
    explore:  { emoji: '🗺️', name: 'استكشاف' },
};

module.exports = {
    name: 'هدف',
    aliases: ['goal'],
    desc: 'تحديد هدف والتقدم نحوه',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        const arg = ctx.args[0];

        // لو مفيش → عرض الأهداف
        if (!arg) {
            const active = db.prepare("SELECT * FROM user_goals WHERE user_jid = ? AND status = 'active'").all(ctx.sender);
            const list = Object.entries(GOALS).map(([id, g]) => `${g.emoji} *${g.name}* (${id})`).join('\n');

            const blocks = [
                { emoji: '🎯', title: 'الأهداف المتاحة', content: list },
                { emoji: '💡', title: 'الاستخدام', content: '.هدف [ID]\nمثال: .هدف army' },
            ];

            if (active.length) {
                const activeList = active.map(a => `🎯 ${GOALS[a.goal_id]?.name || a.goal_id}`).join('\n');
                blocks.push({ emoji: '📌', title: 'أهدافك النشطة', content: activeList });
            }

            return ctx.card('🎯 الأهداف', blocks);
        }

        if (!GOALS[arg]) return ctx.error(`هدف "${arg}" مش معروف`);

        // لو الهدف موجود
        const existing = db.prepare("SELECT * FROM user_goals WHERE user_jid = ? AND goal_id = ? AND status = 'active'").get(ctx.sender, arg);
        if (existing) {
            // اعرض التقدم
            const g = guidance.guide(ctx.sender, arg);
            const msg = guidance.buildGuidanceMessage(g);
            return ctx.card(`🎯 ${GOALS[arg].name}`, [
                { emoji: '✅', title: 'الهدف نشط بالفعل', content: msg.title },
                { emoji: '💡', title: 'للتقدم', content: '.تقدم' },
            ]);
        }

        // ضيف الهدف
        db.prepare('INSERT INTO user_goals (user_jid, goal_id) VALUES (?, ?)').run(ctx.sender, arg);

        const g = guidance.guide(ctx.sender, arg);
        const msg = guidance.buildGuidanceMessage(g);

        await ctx.card(`🎯 هدف جديد: ${GOALS[arg].name}`, [
            { emoji: g.allowed ? '✅' : '⚠️', title: 'الحالة', content: msg.title },
            { emoji: '📋', title: 'المتطلبات', content: msg.content },
            { emoji: '💡', title: 'الخطوة التالية', content: `${msg.next}\n⌨️ ${msg.command}` },
        ]);
    }
};
