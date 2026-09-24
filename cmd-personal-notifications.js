const notif = require('./svc-notifications');
const user = require('./mod-user');

module.exports = {
    name: 'تنبيهات',
    aliases: ['notifications', 'notifs'],
    desc: 'التنبيهات',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        const sub = ctx.args[0];

        if (sub === 'مسح' || sub === 'clear') {
            notif.clear(ctx.sender);
            return ctx.success('تم مسح كل التنبيهات');
        }

        if (sub === 'قرأت' || sub === 'قرات' || sub === 'read') {
            notif.markAllRead(ctx.sender);
            return ctx.success('تم تعليم الكل كمقروء');
        }

        const list = notif.getRecent(ctx.sender, 15);

        if (!list.length) {
            return ctx.card('🔔 التنبيهات', [
                { emoji: '💭', title: 'مفيش تنبيهات', content: 'مفيش أحداث مهمة دلوقتي' },
            ]);
        }

        const content = list.map(n => {
            const mark = n.is_read ? '📭' : '📬';
            const time = new Date(n.created_at * 1000).toLocaleString('ar-EG', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            return `${mark} *${n.type}*\n     ${n.text}\n     ${time}`;
        }).join('\n\n');

        const unread = list.filter(n => !n.is_read).length;

        await ctx.card('🔔 التنبيهات', [
            { emoji: '📬', title: `غير مقروء: ${unread}`, content },
            { emoji: '💡', title: 'أوامر', content: '.تنبيهات قرات — تعليم كـ مقروء\n.تنبيهات مسح — حذف الكل' },
        ]);
    }
};
