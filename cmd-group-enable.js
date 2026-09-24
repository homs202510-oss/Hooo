/**
 * 👻 .اشتغل — تفعيل البوت في الجروب (للمطور فقط)
 */
const state = require('./mod-group-state');
const logs = require('./mod-group-logs');
const user = require('./mod-user');
const dev = require('./mod-developer');

module.exports = {
    name: 'اشتغل',
    aliases: ['تشغيل', 'on'],
    desc: 'تفعيل PHANTOM في الجروب (للمطور)',
    hidden: false,
    async run(ctx) {
        if (!ctx.isGroup) {
            return ctx.error('الأمر ده في الجروبات بس');
        }

        // ═══ Developer فقط ═══
        if (!dev.isDeveloper(ctx.sender) && !user.isOwner(ctx.sender)) {
            return ctx.error('الأمر ده للمطور بس 👑');
        }

        const wasEnabled = state.isEnabled(ctx.jid);
        state.enable(ctx.jid, ctx.sender);

        logs.log(ctx.jid, 'group_enabled', ctx.sender, null, 'developer');

        if (wasEnabled) {
            return ctx.success('PHANTOM شغال بالفعل 👻');
        }

        await ctx.card('👻 PHANTOM اشتغل', [
            { emoji: '✅', title: 'الحالة', content: 'البوت متفعل في الجروب ده' },
            { emoji: '📌', title: 'ملاحظة', content: 'الأوامر شغالة دلوقتي' },
        ]);
    }
};
