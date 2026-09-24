const perm = require('./mod-group-permissions');
const logs = require('./mod-group-logs');
const user = require('./mod-user');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'طرد',
    aliases: ['kick'],
    desc: 'طرد عضو',
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
        if (!perm.canModerate(ctx.sender, targetJid, ctx.groupMetadata, ctx.sock.user?.id))
            return ctx.error('مش ممكن تطرد الشخص ده');

        // فحص حديث
        const isBotAdmin = await perm.checkBotAdminFresh(ctx.sock, ctx.jid);
        if (!isBotAdmin) return ctx.error('البوت مش أدمن — رقّيه أول');

        try {
            await ctx.sock.groupParticipantsUpdate(ctx.jid, [targetJid], 'remove');
            logs.log(ctx.jid, 'kick', ctx.sender, targetJid, null);
            const num = extractNumber(targetJid);
            await ctx.sock.sendMessage(ctx.jid, {
                text: `👢 تم طرد @${num}`,
                mentions: [targetJid],
            });
        } catch (e) {
            return ctx.error('فشل الطرد: ' + e.message);
        }
    }
};
