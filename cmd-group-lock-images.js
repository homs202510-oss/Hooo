const settings = require('./mod-group-settings');
const perm = require('./mod-group-permissions');
const logs = require('./mod-group-logs');
const user = require('./mod-user');

module.exports = {
    name: 'قفل_الصور',
    aliases: ['lockimages'],
    desc: 'حماية من الصور',
    groupOnly: true,
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        if (perm.level(ctx.sender, ctx.groupMetadata, ctx.sock.user?.id) === 'member')
            return ctx.error('الأمر ده للأدمن بس');
        const v = settings.toggle(ctx.jid, 'image_protection');
        logs.log(ctx.jid, 'protection', ctx.sender, null, 'image=' + v);
        await ctx.success(v ? '✅ اتفعلت حماية الصور' : '❌ اتقفلت حماية الصور');
    }
};
