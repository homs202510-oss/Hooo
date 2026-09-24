const user = require('./mod-user');
const kd = require('./mod-kingdom');

module.exports = {
    name: 'معلوماتي',
    aliases: ['whois', 'من-انا'],
    desc: 'معلوماتك الكاملة',
    async run(ctx) {
        let targetJid = ctx.sender;
        let isSelf = true;

        if (ctx.mentioned.length > 0) { targetJid = ctx.mentioned[0]; isSelf = false; }
        else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;
            isSelf = false;
        }

        const u = user.getOrCreate(targetJid, isSelf ? ctx.pushName : null);
        const rank = user.getRank(u);
        const displayName = u.name || u.push_name || 'مجهول';
        const k = kd.getKingdom(targetJid);

        const joinDate = u.created_at ? new Date(u.created_at * 1000).toLocaleDateString('ar-EG') : 'غير معروف';
        const lastSeen = u.last_seen ? new Date(u.last_seen * 1000).toLocaleString('ar-EG') : 'غير معروف';

        const blocks = [
            { emoji: '👤', title: 'الهوية', content: ` الاسم   : ${displayName}\n الرتبة  : ${rank.name}\n المستوى : ${u.level}` },
            { emoji: '📊', title: 'التقدم', content: ` XP     : ${u.xp}\n العملات : ${u.coins} 🪙` },
            { emoji: '📅', title: 'التواريخ', content: ` الانضمام  : ${joinDate}\n آخر ظهور : ${lastSeen}` },
        ];

        if (k) {
            blocks.push({
                emoji: '🏰', title: 'المملكة',
                content: ` الاسم  : ${k.name}\n المستوى : ${k.level}\n القوة   : ${k.power.toLocaleString('ar-EG')}`
            });
        }

        await ctx.card('معلومات', blocks, isSelf ? [] : [targetJid]);
    }
};
