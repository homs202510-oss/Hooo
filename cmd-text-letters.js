const text = require('./svc-text');
const user = require('./mod-user');

async function getText(ctx) {
    if (ctx.args.length > 0) return ctx.args.join(' ');
    const ctxInfo = ctx.msg.message?.extendedTextMessage?.contextInfo;
    if (ctxInfo?.quotedMessage) {
        const m = ctxInfo.quotedMessage;
        return m.conversation || m.extendedTextMessage?.text || '';
    }
    return '';
}

module.exports = {
    name: 'حروف',
    aliases: ['letters'],
    desc: 'تحليل الحروف',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const t = await getText(ctx);
        if (!t) return ctx.error('ابعت نص');

        const arabic = (t.match(/[\u0600-\u06FF]/g) || []).length;
        const english = (t.match(/[A-Za-z]/g) || []).length;
        const digits = (t.match(/\d/g) || []).length;
        const spaces = (t.match(/\s/g) || []).length;

        await ctx.card('🔤 تحليل الحروف', [
            { emoji: '🔤', title: 'إجمالي الحروف', content: `${text.countChars(t, false)}` },
            { emoji: '🇸🇦', title: 'حروف عربية', content: `${arabic}` },
            { emoji: '🇬🇧', title: 'حروف إنجليزية', content: `${english}` },
            { emoji: '🔢', title: 'أرقام', content: `${digits}` },
            { emoji: '␣', title: 'مسافات', content: `${spaces}` },
            { emoji: '📝', title: 'كلمات', content: `${text.countWords(t)}` },
        ]);
    }
};
