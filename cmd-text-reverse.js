const text = require('./svc-text');
const user = require('./mod-user');

module.exports = {
    name: 'قلب',
    aliases: ['reverse'],
    desc: 'قلب النص',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const t = ctx.args.join(' ').trim();
        if (!t) return ctx.error('اكتب النص\n.قلب [نص] أو .قلب كلمات [نص]');

        if (t.startsWith('كلمات ') || t.startsWith('words ')) {
            const rest = t.replace(/^(كلمات|words)\s+/, '');
            return ctx.reply(text.reverseWords(rest));
        }

        await ctx.reply(text.reverseText(t));
    }
};
