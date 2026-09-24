const user = require('./mod-user');

module.exports = {
    name: 'رصيد',
    aliases: ['balance', 'فلوس', 'coins'],
    desc: 'عرض الرصيد الحالي',
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
        const displayName = u.name || u.push_name || 'مجهول';
        const rank = user.getRank(u);

        await ctx.card('الرصيد', [
            { emoji: '👤', title: 'صاحب الحساب', content: ` ${displayName}\n الرتبة: ${rank.name}` },
            { emoji: '💰', title: 'الرصيد الحالي', content: ` ${u.coins} 🪙` },
        ], isSelf ? [] : [targetJid]);
    }
};
