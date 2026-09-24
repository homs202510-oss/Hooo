/**
 * ⚠️ .تحذيرات @user
 */
const warn = require('./mod-group-warnings');
const user = require('./mod-user');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'تحذيرات',
    aliases: ['warns'],
    desc: 'عرض تحذيرات عضو',
    groupOnly: true,
    async run(ctx) {
        let targetJid = ctx.sender;
        if (ctx.mentioned.length > 0) targetJid = ctx.mentioned[0];
        else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant)
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;

        const targetNum = extractNumber(targetJid);
        const count = warn.getCount(ctx.jid, targetJid);
        const rec = warn.get(ctx.jid, targetJid);

        await ctx.card('⚠️ التحذيرات', [
            { emoji: '👤', title: 'العضو', content: `@${targetNum}` },
            { emoji: '📊', title: 'العدد', content: `${count}/${warn.MAX_WARNINGS}` },
            ...(rec?.reason ? [{ emoji: '📌', title: 'آخر سبب', content: rec.reason }] : []),
        ], [targetJid]);
    }
};
