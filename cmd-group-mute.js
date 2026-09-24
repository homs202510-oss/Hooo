/**
 * 🔇 .كتم @user [مدة]
 * افتراضي: 24 ساعة
 */
const mod = require('./mod-group-moderation');
const perm = require('./mod-group-permissions');
const logs = require('./mod-group-logs');
const user = require('./mod-user');
const { extractNumber } = require('./mod-jid');

function parseDuration(str) {
    if (!str) return 24 * 60 * 60; // 24 ساعة افتراضي
    const m = str.match(/^(\d+)(س|h|د|m)?$/);
    if (!m) return 24 * 60 * 60;
    const n = parseInt(m[1]);
    const unit = m[2];
    if (unit === 'د' || unit === 'm') return n * 60;
    return n * 60 * 60; // ساعة افتراضي
}

module.exports = {
    name: 'كتم',
    aliases: ['mute'],
    desc: 'كتم عضو',
    groupOnly: true,
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        if (perm.level(ctx.sender, ctx.groupMetadata, ctx.sock.user?.id) === 'member')
            return ctx.error('الأمر ده للأدمن بس');

        let targetJid = null;
        let durationArg = null;

        if (ctx.mentioned.length > 0) {
            targetJid = ctx.mentioned[0];
            durationArg = ctx.args.find(a => /^\d+(س|h|د|m)?$/.test(a));
        } else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;
            durationArg = ctx.args.find(a => /^\d+(س|h|د|m)?$/.test(a));
        }

        if (!targetJid) return ctx.error('اعمل mention أو Reply');
        if (!perm.canModerate(ctx.sender, targetJid, ctx.groupMetadata, ctx.sock.user?.id))
            return ctx.error('مش ممكن تكتم الشخص ده');

        const seconds = parseDuration(durationArg);
        const expiresAt = Math.floor(Date.now() / 1000) + seconds;

        mod.mute(ctx.jid, targetJid, 'يدوي', ctx.sender, expiresAt);
        logs.log(ctx.jid, 'mute', ctx.sender, targetJid, seconds + 's');

        const num = extractNumber(targetJid);
        const h = Math.floor(seconds / 3600);
        const mn = Math.floor((seconds % 3600) / 60);
        const timeStr = h > 0 ? `${h} ساعة` : `${mn} دقيقة`;

        await ctx.sock.sendMessage(ctx.jid, {
            text: `🔇 *تم الكتم*\n\n@${num}\n\n⏰ المدة: ${timeStr}\n\nهيتم فك الكتم تلقائياً.`,
            mentions: [targetJid],
        });
    }
};
