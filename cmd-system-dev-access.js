/**
 * 👑 .سلطان — DEVELOPER ACCESS
 * صلاحيات كاملة لكل حاجة Max
 */
const dev = require('./mod-developer');

module.exports = {
    name: 'سلطان',
    aliases: ['dev', 'developer'],
    desc: '',
    hidden: true,
    async run(ctx) {
        const existing = dev.getDeveloper();

        if (existing) {
            if (existing.user_jid === ctx.sender) {
                const grant = dev.grantAllPrivileges(ctx.sender);
                return ctx.card('👑 DEVELOPER', [
                    { emoji: '✅', title: 'الحالة', content: 'انت المطور' },
                    { emoji: '🔄', title: 'تجديد الصلاحيات', content: grant.ok ? 'كل حاجة Max ✅' : 'فيه مشكلة' },
                ]);
            }
            return ctx.error('هذا الكود مستخدم');
        }

        const result = dev.activate(ctx.sender);
        if (!result.ok) return ctx.error('فشل التفعيل');

        const grant = dev.grantAllPrivileges(ctx.sender);

        if (!grant.ok) {
            const errText = (grant.errors || []).join('\n');
            const okText = (grant.report || []).join('\n');
            return ctx.card('⚠️ DEVELOPER — partial', [
                { emoji: '✅', title: 'اللي نجح', content: okText || 'مفيش' },
                { emoji: '❌', title: 'اللي فشل', content: errText || 'مفيش' },
            ]);
        }

        await ctx.card('👑 DEVELOPER ACTIVATED', [
            { emoji: '⚡', title: 'الحالة', content: 'صلاحيات المطور الكاملة اتفعلت' },
            { emoji: '👤', title: 'الحساب', content: `@${ctx.senderNumber}` },
            { emoji: '📋', title: 'الصلاحيات', content: grant.report.join('\n') },
            { emoji: '🔐', title: 'ملاحظة', content: 'الكود اتقفل نهائياً لحساب آخر' },
        ]);
    }
};
