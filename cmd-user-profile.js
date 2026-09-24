const user = require('./mod-user');

module.exports = {
    name: 'بروفايل',
    aliases: ['profile', 'ملفي'],
    desc: 'عرض ملف المستخدم',
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
            {
                emoji: '👤',
                title: 'المعلومات الأساسية',
                content: ` الاسم    : ${displayName}\n الرتبة   : ${rank.name}\n المستوى  : ${u.level}`
            },
            {
                emoji: '📊',
                title: 'التقدم',
                content: ` XP      : ${u.xp}\n العملات : ${u.coins} 🪙`
            },
            {
                emoji: '🎒',
                title: 'الممتلكات',
                content: ` عناصر الحقيبة : ${itemCount}`
            },
            {
                emoji: '📅',
                title: 'التواريخ',
                content: ` انضم في    : ${joinDate}\n آخر نشاط  : ${lastSeen}`
            },
        ];

        await ctx.card('البروفايل', blocks, isSelf ? [] : [targetJid]);
    }
};
