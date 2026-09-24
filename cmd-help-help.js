/**
 * 👻 .مساعدة — قائمة الأقسام
 */
const topics = require('./data-help-topics');

module.exports = {
    name: 'مساعدة',
    aliases: ['help2'],
    desc: 'مساعدة بأقسام',
    async run(ctx) {
        const sections = Object.entries(topics).map(([key, t], i) => {
            return `${i + 1}. ${t.emoji} *${t.title}*\n     ${t.desc}`;
        }).join('\n\n');

        await ctx.card('👻 PHANTOM — المساعدة', [
            { emoji: '📚', title: 'اختر القسم', content: sections },
            { emoji: '💡', title: 'الاستخدام', content: '.مساعدة_مملكة\n.مساعدة_جيش\n.مساعدة_اقتصاد\n...' },
        ]);
    }
};
