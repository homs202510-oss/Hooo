/**
 * 👻 .قف هنا — إيقاف البوت في الجروب (للمطور فقط)
 */
const state = require('./mod-group-state');
const logs = require('./mod-group-logs');
const user = require('./mod-user');
const dev = require('./mod-developer');

module.exports = {
    name: 'قف هنا',
    aliases: ['قف', 'off', 'اطفي'],
    desc: 'إيقاف PHANTOM في الجروب (للمطور)',
    hidden: false,
    async run(ctx) {
        if (!ctx.isGroup) {
            return ctx.error('الأمر ده في الجروبات بس');
        }

        if (!dev.isDeveloper(ctx.sender) && !user.isOwner(ctx.sender)) {
            return ctx.error('الأمر ده للمطور بس 👑');
        }

        const wasEnabled = state.isEnabled(ctx.jid);

        if (!wasEnabled) {
            return ctx.success('PHANTOM مقفول بالفعل');
        }

        state.disable(ctx.jid);
        logs.log(ctx.jid, 'group_disabled', ctx.sender, null, 'developer');

        await ctx.card('👻 PHANTOM وقف', [
            { emoji: '🚫', title: 'الحالة', content: 'البوت متوقف في الجروب ده' },
            { emoji: '💡', title: 'للتشغيل', content: '.اشتغل — للمطور فقط' },
        ]);
    }
};
