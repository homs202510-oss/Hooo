/**
 * 👋 .ترحيب — تفعيل/إيقاف رسالة الترحيب
 */
const settings = require('./mod-group-settings');
const perm = require('./mod-group-permissions');
const user = require('./mod-user');

module.exports = {
    name: 'ترحيب',
    aliases: ['welcome'],
    desc: 'ترحيب الأعضاء الجدد',
    groupOnly: true,
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const permLevel = perm.level(ctx.sender, ctx.groupMetadata, ctx.sock.user?.id);
        if (permLevel === 'member') return ctx.error('الأمر ده للأدمن بس');

        const newState = settings.toggle(ctx.jid, 'welcome');
        await ctx.success(`${newState ? '✅ اتفعل' : '❌ اتقفل'}: رسالة الترحيب`);
    }
};
