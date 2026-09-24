const db = require('./core-database');
const user = require('./mod-user');

module.exports = {
    name: 'افتكر',
    aliases: ['remember', 'علمني'],
    desc: 'علّم الشبح حاجة عنك',
    async run(ctx) {
        const fact = ctx.args.join(' ').trim();

        if (!fact) {
            return ctx.card('افتكر', [
                { emoji: '💭', title: 'الطريقة', content: '.افتكر [معلومة عنك]\nمثال: .افتكر بحب القهوة' },
                { emoji: '📖', title: 'ليه؟', content: 'الشبح هيفضل فاكر المعلومة دي عنك' },
            ]);
        }

        if (fact.length > 200) return ctx.error('المعلومة طويلة (الحد 200 حرف)');

        user.getOrCreate(ctx.sender, ctx.pushName);

        db.prepare('INSERT INTO memory (user_jid, fact) VALUES (?, ?)').run(ctx.sender, fact);

        const count = db.prepare('SELECT COUNT(*) as c FROM memory WHERE user_jid = ?').get(ctx.sender).c;

        await ctx.card('تم الحفظ 📖', [
            { emoji: '💭', title: 'المعلومة', content: fact },
            { emoji: '📚', title: 'عدد المعلومات عنك', content: `${count}` },
        ]);
    }
};
