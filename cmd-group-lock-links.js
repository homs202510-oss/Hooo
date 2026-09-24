const settings = require('./mod-group-settings');
const perm = require('./mod-group-permissions');
const logs = require('./mod-group-logs');
const user = require('./mod-user');

module.exports = {
    name: 'قفل_الروابط',
    aliases: ['locklinks'],
    desc: 'حماية من الروابط',
    groupOnly: true,
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        if (perm.level(ctx.sender, ctx.groupMetadata, ctx.sock.user?.id) === 'member')
            return ctx.error('الأمر ده للأدمن بس');
        const v = settings.toggle(ctx.jid, 'link_protection');
        logs.log(ctx.jid, 'protection', ctx.sender, null, 'link=' + v);
        await ctx.success(v ? '✅ اتفعلت حماية الروابط' : '❌ اتقفلت حماية الروابط');
    }
};
