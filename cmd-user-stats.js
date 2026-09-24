const user = require('./mod-user');

module.exports = {
    name: 'إحصائيات',
    aliases: ['stats', 'احصائيات'],
    desc: 'عرض إحصائيات المستخدم',
    async run(ctx) {
        let targetJid = ctx.sender;
        let isSelf = true;

        if (ctx.mentioned.length > 0) {
            targetJid = ctx.mentioned[0];
            isSelf = false;
        } else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;
            isSelf = false;
        }

        const u = user.getOrCreate(targetJid, isSelf ? ctx.pushName : null);
        const rank = user.getRank(u);
        const displayName = u.name || u.push_name || 'مجهول';
        const itemCount = user.getInventoryCount(targetJid);

        const joinDate = u.created_at
            ? new Date(u.created_at * 1000).toLocaleDateString('ar-EG')
            : 'غير معروف';
        const lastSeen = u.last_seen
            ? new Date(u.last_seen * 1000).toLocaleString('ar-EG')
            : 'غير معروف';

        const blocks = [
            { emoji: '👤', title: 'المستخدم', content: ` الاسم : ${displayName}` },
            {
                emoji: '📊',
                title: 'التقدم',
                content: ` XP      : ${u.xp}\n المستوى : ${u.level}\n الرتبة  : ${rank.name}`
            },
            { emoji: '💰', title: 'الاقتصاد', content: ` الرصيد : ${u.coins} 🪙` },
            { emoji: '🎒', title: 'الحقيبة', content: ` العناصر : ${itemCount}` },
            {
                emoji: '📅',
                title: 'التواريخ',
                content: ` التسجيل     : ${joinDate}\n آخر نشاط   : ${lastSeen}`
            },
        ];

        await ctx.card('الإحصائيات', blocks, isSelf ? [] : [targetJid]);
    }
};
