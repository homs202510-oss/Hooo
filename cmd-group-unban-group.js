/**
 * 🔓 .فك_حظر_جروب @user
 */
const mod = require('./mod-group-moderation');
const perm = require('./mod-group-permissions');
const logs = require('./mod-group-logs');
const user = require('./mod-user');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'فك_حظر_جروب',
    aliases: ['gunban'],
    desc: 'فك حظر عضو',
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

        mod.unban(ctx.jid, targetJid);
        logs.log(ctx.jid, 'unban', ctx.sender, targetJid, null);

        const num = extractNumber(targetJid);
        await ctx.sock.sendMessage(ctx.jid, {
            text: `🔓 تم فك حظر @${num}`,
            mentions: [targetJid],
        });
    }
};
