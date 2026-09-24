const text = require('./svc-text');
const user = require('./mod-user');

module.exports = {
    name: 'مسافة',
    aliases: ['spaces'],
    desc: 'ضبط المسافات',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const t = ctx.args.join(' ').trim();
        if (!t) return ctx.error('الاستخدام:\n.مسافة نظف [نص] — يزيل المسافات الزايدة\n.مسافة باعد [نص] — يباعد الحروف');

        if (t.startsWith('نظف ') || t.startsWith('clean ')) {
            const rest = t.replace(/^(نظف|clean)\s+/, '');
            return ctx.reply(text.removeExtraSpaces(rest));
        }
        if (t.startsWith('باعد ') || t.startsWith('space ')) {
            const rest = t.replace(/^(باعد|space)\s+/, '');
            return ctx.reply(text.addSpaces(rest, 1));
        }

        await ctx.card('␣ المسافة', [
            { emoji: '🧹', title: 'تنظيف', content: '.مسافة نظف [نص]' },
            { emoji: '↔️', title: 'تباعد', content: '.مسافة باعد [نص]' },
        ]);
    }
};
