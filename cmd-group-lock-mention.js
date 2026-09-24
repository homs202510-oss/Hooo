const settings = require('./mod-group-settings');
const perm = require('./mod-group-permissions');
const logs = require('./mod-group-logs');
const user = require('./mod-user');

module.exports = {
    name: 'قفل_المنشن',
    aliases: ['lockmention'],
    desc: 'حماية من المنشن الجماعي',
    groupOnly: true,
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        if (perm.level(ctx.sender, ctx.groupMetadata, ctx.sock.user?.id) === 'member')
            return ctx.error('الأمر ده للأدمن بس');
        const v = settings.toggle(ctx.jid, 'mention_protection');
        logs.log(ctx.jid, 'protection', ctx.sender, null, 'mention=' + v);
        await ctx.success(v ? '✅ اتفعلت حماية المنشن' : '❌ اتقفلت حماية المنشن');
    }
};
