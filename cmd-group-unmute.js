/**
 * 🔊 .فك_كتم @user
 */
const mod = require('./mod-group-moderation');
const perm = require('./mod-group-permissions');
const logs = require('./mod-group-logs');
const user = require('./mod-user');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'فك_كتم',
    aliases: ['unmute'],
    desc: 'فك كتم',
    groupOnly: true,
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        if (perm.level(ctx.sender, ctx.groupMetadata, ctx.sock.user?.id) === 'member')
            return ctx.error('الأمر ده للأدمن بس');

        let targetJid = null;
        if (ctx.mentioned.length > 0) targetJid = ctx.mentioned[0];
        else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant)
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;

        if (!targetJid) return ctx.error('اعمل mention أو Reply');

        mod.unmute(ctx.jid, targetJid);
        logs.log(ctx.jid, 'unmute', ctx.sender, targetJid, 'يدوي');

        const num = extractNumber(targetJid);
        await ctx.sock.sendMessage(ctx.jid, {
            text: `🔊 *تم فك الكتم*\n\n@${num}\n\nنورت تاني 👻`,
            mentions: [targetJid],
        });
    }
};
