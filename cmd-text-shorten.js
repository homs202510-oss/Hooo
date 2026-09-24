const text = require('./svc-text');
const user = require('./mod-user');

module.exports = {
    name: 'اختصار',
    aliases: ['shorten'],
    desc: 'اختصار النص',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        let t = ctx.args.join(' ').trim();
        if (!t) {
            const ctxInfo = ctx.msg.message?.extendedTextMessage?.contextInfo;
            if (ctxInfo?.quotedMessage) {
                t = ctxInfo.quotedMessage.conversation || ctxInfo.quotedMessage.extendedTextMessage?.text || '';
            }
        }
        if (!t) return ctx.error('ابعت نص أو اعمل Reply\n.اختصار [نص] [طول]');

        const match = t.match(/^(.+?)\s+(\d+)$/);
        let content = t, maxLen = 100;
        if (match) { content = match[1].trim(); maxLen = parseInt(match[2]); }
        if (maxLen < 10) maxLen = 10;
        if (maxLen > 1000) maxLen = 1000;

        await ctx.reply(text.shorten(content, maxLen));
    }
};
