/**
 * 🧹 .مسح_تحذيرات @user
 */
const warn = require('./mod-group-warnings');
const perm = require('./mod-group-permissions');
const logs = require('./mod-group-logs');
const user = require('./mod-user');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'مسح_تحذيرات',
    aliases: ['clearwarns'],
    desc: 'مسح تحذيرات عضو',
    groupOnly: true,
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const permLevel = perm.level(ctx.sender, ctx.groupMetadata, ctx.sock.user?.id);
        if (permLevel === 'member') return ctx.error('الأمر ده للأدمن بس');

        let targetJid = null;
        if (ctx.mentioned.length > 0) targetJid = ctx.mentioned[0];
        else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant)
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;

        if (!targetJid) return ctx.error('اعمل mention أو Reply');

        warn.clear(ctx.jid, targetJid);
        logs.log(ctx.jid, 'clear_warnings', ctx.sender, targetJid, null);

        const num = extractNumber(targetJid);
        await ctx.sock.sendMessage(ctx.jid, {
            text: `✅ تم مسح تحذيرات @${num}`,
            mentions: [targetJid],
        });
    }
};
