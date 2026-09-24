const text = require('./svc-text');
const user = require('./mod-user');

async function getText(ctx) {
    if (ctx.args.length > 0) return ctx.args.join(' ');
    const ctxInfo = ctx.msg.message?.extendedTextMessage?.contextInfo;
    if (ctxInfo?.quotedMessage) {
        const m = ctxInfo.quotedMessage;
        return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || '';
    }
    return '';
}

module.exports = {
    name: 'عد',
    aliases: ['count'],
    desc: 'عد الكلمات والحروف',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const t = await getText(ctx);
        if (!t) return ctx.error('ابعت نص أو اعمل Reply على رسالة');

        await ctx.card('🔢 عد النص', [
            { emoji: '📝', title: 'الكلمات', content: `${text.countWords(t)}` },
            { emoji: '🔤', title: 'الحروف (مع المسافات)', content: `${text.countChars(t, true)}` },
            { emoji: '🔠', title: 'الحروف (بدون مسافات)', content: `${text.countChars(t, false)}` },
            { emoji: '📄', title: 'الأسطر', content: `${text.countLines(t)}` },
        ]);
    }
};
