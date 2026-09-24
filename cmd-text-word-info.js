const text = require('./svc-text');
const user = require('./mod-user');

module.exports = {
    name: 'كلمة',
    aliases: ['word'],
    desc: 'معلومات الكلمات',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        let t = ctx.args.join(' ').trim();
        if (!t) {
            const ctxInfo = ctx.msg.message?.extendedTextMessage?.contextInfo;
            if (ctxInfo?.quotedMessage) {
                t = ctxInfo.quotedMessage.conversation || ctxInfo.quotedMessage.extendedTextMessage?.text || '';
            }
        }
        if (!t) return ctx.error('ابعت نص');

        const words = t.trim().split(/\s+/).filter(Boolean);

        await ctx.card('📖 معلومات النص', [
            { emoji: '📝', title: 'عدد الكلمات', content: `${words.length}` },
            { emoji: '📏', title: 'أطول كلمة', content: text.longestWord(t).substring(0, 60) },
            { emoji: '📐', title: 'أقصر كلمة', content: text.shortestWord(t).substring(0, 60) },
            { emoji: '🔤', title: 'عدد الحروف', content: `${text.countChars(t, false)}` },
        ]);
    }
};
