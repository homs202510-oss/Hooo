const titles = require('./mod-titles');
const user = require('./mod-user');

module.exports = {
    name: 'لقب',
    aliases: ['title'],
    desc: 'الألقاب',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const arg = ctx.args[0];

        // تحديد لقب
        if (arg === 'شيل') {
            titles.setActiveTitle(ctx.sender, null);
            return ctx.success('تم إزالة اللقب');
        }

        if (arg === 'استخدم' || arg === 'اختار') {
            const title = ctx.args.slice(1).join(' ').trim();
            if (!title) return ctx.error('اكتب اللقب\nمثال: .لقب استخدم 🏷️ الفاتح');
            const res = titles.setActiveTitle(ctx.sender, title);
            if (!res.ok) {
                if (res.reason === 'not_owned') return ctx.error('اللقب ده مش مفتوح عندك');
            }
            return ctx.success(`تم تفعيل اللقب:\n${title}`);
        }

        const list = titles.getTitles(ctx.sender);
        const active = titles.getActiveTitle(ctx.sender);

        if (!list.length) {
            return ctx.card('🏷️ الألقاب', [
                { emoji: '💭', title: 'مفيش ألقاب', content: 'لسه مفتحتش ألقاب' },
                { emoji: '💡', title: 'كيف', content: 'افتح إنجازات → تفتح ألقاب' },
            ]);
        }

        const listText = list.map(t => (t === active ? `✨ *${t}* (مفعّل)` : `  ${t}`)).join('\n');

        await ctx.card('🏷️ الألقاب', [
            { emoji: '📋', title: `المفتوحة (${list.length})`, content: listText },
            { emoji: '💡', title: 'الاستخدام', content: '.لقب استخدم [اللقب]\n.لقب شيل — لإزالة اللقب' },
        ]);
    }
};
