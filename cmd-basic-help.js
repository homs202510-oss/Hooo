const { CATEGORIES } = require('./data-commands-menu');

module.exports = {
    name: 'اوامر',
    aliases: ['help', 'الاوامر', 'مساعدة', 'قائمة'],
    desc: 'قائمة الأوامر بأقسام',
    async run(ctx) {
        const input = ctx.args[0];

        // ═══ القائمة الرئيسية ═══
        if (!input) {
            const list = CATEGORIES.map((c, i) => {
                const num = String(i + 1).padStart(2, '0');
                const count = c.commands.length;
                const status = count > 0 ? `${count} أمر` : 'قيد الإنشاء';
                return `⟢  ${num}  ${c.emoji}  *${c.name}*\n       └ ${status}`;
            }).join('\n\n');

            const text = require('./util-format').card('قائمة الأقسام', [
                { emoji: '📋', title: 'الأقسام', content: list },
                { emoji: '💡', title: 'الاستخدام', content: '.اوامر [رقم القسم]\nمثال: .اوامر 1' },
            ]);

            // ✅ صورة إجبارية مع القائمة الرئيسية
            await ctx.sendWithProfile(text, { force: true });
            return;
        }

        // ═══ قسم معين ═══
        const cat = CATEGORIES.find(c => c.id === parseInt(input));
        if (!cat) return ctx.error(`القسم رقم ${input} مش موجود`);

        if (!cat.commands.length) {
            const text = require('./util-format').card(`${cat.emoji} ${cat.name}`, [
                { emoji: '⏳', title: 'قيد الإنشاء', content: 'هتتضاف قريباً' },
            ]);
            await ctx.sendWithProfile(text);
            return;
        }

        const list = cat.commands.map((cmd, i) => {
            const num = String(i + 1).padStart(2, '0');
            return `⟢  ${num}  ${cmd}`;
        }).join('\n');

        const text = require('./util-format').card(`${cat.emoji} ${cat.name}`, [
            { emoji: '📜', title: `الأوامر (${cat.commands.length})`, content: list },
            { emoji: '💡', title: 'ملاحظة', content: '.اوامر — للرجوع للأقسام' },
        ]);

        // ✅ صورة مع كل قسم
        await ctx.sendWithProfile(text);
    }
};
