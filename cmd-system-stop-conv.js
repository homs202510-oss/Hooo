/**
 * 👑 .وقف تفاعل — للمطور فقط
 * يوقف كل أنواع التفاعل
 */
const conv = require('./mod-conversation');
const dev = require('./mod-developer');

module.exports = {
    name: 'وقف',
    aliases: [],
    desc: 'إيقاف نظام التفاعل',
    hidden: false,
    async run(ctx) {
        if (!dev.isPrivileged(ctx.sender)) {
            return ctx.error('الأمر ده للمطور بس 👑');
        }

        const sub = ctx.args[0];

        // .وقف تفاعل
        if (sub === 'تفاعل') {
            // إيقاف تفاعل المستخدم
            conv.disableUser(ctx.sender);

            // لو في جروب، إيقاف تفاعل الجروب
            if (ctx.isGroup) {
                conv.disableGroup(ctx.jid);
            }

            return ctx.success(`⛔ تم إيقاف نظام التفاعل بالكامل

• تفاعلك الشخصي: ❌
${ctx.isGroup ? '• تفاعل الجروب: ❌' : ''}

📌 لإعادة التفعيل:
• .تفاعل
• .تفاعل الكل (في الجروب)`);
        }

        // .وقف — بدون sub
        return ctx.card('⛔ إيقاف', [
            { emoji: '💡', title: 'الاستخدام', content: '.وقف تفاعل\nلإيقاف نظام المحادثة' },
        ]);
    }
};
