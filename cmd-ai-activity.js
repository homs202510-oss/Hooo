const activity = require('./mod-activity');
const user = require('./mod-user');

function bar(p, t) {
    if (t === 0) return '░'.repeat(10) + ' 0%';
    const percent = Math.min(100, Math.floor((p / t) * 100));
    const filled = Math.floor(percent / 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled) + ' ' + percent + '%';
}

module.exports = {
    name: 'نشاط',
    aliases: ['activity'],
    desc: 'نشاطك اليومي',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        let targetJid = ctx.sender;
        let isSelf = true;

        if (ctx.mentioned.length > 0) { targetJid = ctx.mentioned[0]; isSelf = false; }
        else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;
            isSelf = false;
        }

        const today = activity.getToday(targetJid);
        const total = activity.getTotal(targetJid);
        const week = activity.getLast7(targetJid);
        const u = user.getOrCreate(targetJid);
        const displayName = u.name || u.push_name || 'مجهول';

        const blocks = [
            {
                emoji: '📊', title: `اليوم`,
                content: `📨 رسائل: ${today.messages}\n⚡ أوامر: ${today.commands}\n💬 AI: ${today.ai_msgs}\n⭐ XP: ${today.xp_earned}`,
            },
            {
                emoji: '📈', title: `الإجمالي`,
                content: `📨 رسائل: ${total.messages.toLocaleString('ar-EG')}\n⚡ أوامر: ${total.commands.toLocaleString('ar-EG')}\n💬 AI: ${total.ai_msgs.toLocaleString('ar-EG')}\n⭐ XP: ${total.xp_earned.toLocaleString('ar-EG')}`,
            },
        ];

        if (week.length > 1) {
            const weekText = week.map(d => `  ${d.day}: 📨${d.messages} ⚡${d.commands}`).join('\n');
            blocks.push({ emoji: '📅', title: 'آخر 7 أيام', content: weekText });
        }

        await ctx.card(`📊 نشاط ${displayName}`, blocks, isSelf ? [] : [targetJid]);
    }
};
