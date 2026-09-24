const text = require('./svc-text');
const user = require('./mod-user');

module.exports = {
    name: 'زخرف',
    aliases: ['decorate'],
    desc: 'زخرفة النص',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const t = ctx.args.join(' ').trim();
        if (!t) {
            const preview = 'PHANTOM 👻';
            const styles = [1,2,3,4,5,6,7,8,9,10].map(i => `${i}. ${text.decorate(preview, i)}`).join('\n');
            return ctx.card('✨ زخرفة النص', [
                { emoji: '📋', title: 'الأنماط', content: styles },
                { emoji: '💡', title: 'الاستخدام', content: '.زخرف [نص] [نمط 1-10]' },
            ]);
        }

        const match = t.match(/^(.+?)\s+(\d+)$/);
        let content = t, style = 1;
        if (match) { content = match[1].trim(); style = parseInt(match[2]); }

        const result = text.decorate(content, style);
        await ctx.reply(result);
    }
};
