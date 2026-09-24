/**
 * 🚫 .حظر_جروب @user
 */
const mod = require('./mod-group-moderation');
const perm = require('./mod-group-permissions');
const logs = require('./mod-group-logs');
const user = require('./mod-user');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'حظر_جروب',
    aliases: ['gban'],
    desc: 'حظر عضو في الجروب',
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
        if (!perm.canModerate(ctx.sender, targetJid, ctx.groupMetadata, ctx.sock.user?.id))
            return ctx.error('مش ممكن تحظر الشخص ده');

        mod.ban(ctx.jid, targetJid, 'يدوي', ctx.sender);
        logs.log(ctx.jid, 'ban', ctx.sender, targetJid, null);

        // حاول تطرده
        const isBotAdmin = perm.isBotAdmin(ctx.groupMetadata, ctx.sock.user?.id);
        if (isBotAdmin) {
            try { await ctx.sock.groupParticipantsUpdate(ctx.jid, [targetJid], 'remove'); } catch (_) {}
        }

        const num = extractNumber(targetJid);
        await ctx.sock.sendMessage(ctx.jid, {
            text: `🚫 تم حظر @${num}\n\n${isBotAdmin ? 'وتم طرده من الجروب' : '⚠️ البوت مش أدمن — لم يُطرد'}`,
            mentions: [targetJid],
        });
    }
};
