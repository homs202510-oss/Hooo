/**
 * 👋 .وداع
 */
const settings = require('./mod-group-settings');
const perm = require('./mod-group-permissions');
const user = require('./mod-user');

module.exports = {
    name: 'وداع',
    aliases: ['goodbye'],
    desc: 'رسالة الوداع',
    groupOnly: true,
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const permLevel = perm.level(ctx.sender, ctx.groupMetadata, ctx.sock.user?.id);
        if (permLevel === 'member') return ctx.error('الأمر ده للأدمن بس');

        const newState = settings.toggle(ctx.jid, 'goodbye');
        await ctx.success(`${newState ? '✅ اتفعل' : '❌ اتقفل'}: رسالة الوداع`);
    }
};
