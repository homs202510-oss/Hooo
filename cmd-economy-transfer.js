const user = require('./mod-user');
const tracker = require('./mod-tracker');

const MAX_AMOUNT = 1_000_000_000;

module.exports = {
    name: 'تحويل',
    aliases: ['transfer', 'حول'],
    desc: 'تحويل فلوس لمستخدم',
    async run(ctx) {
        let targetJid = null;
        let amountArg = null;
        const mentioned = ctx.mentioned;
        const replied = ctx.msg.message?.extendedTextMessage?.contextInfo?.participant;

        if (mentioned.length > 0) { targetJid = mentioned[0]; amountArg = ctx.args[0]; }
        else if (replied) { targetJid = replied; amountArg = ctx.args[0]; }
        else {
            return ctx.card('التحويل', [
                { emoji: '💸', title: 'الاستخدام', content: ' .تحويل @شخص 500\n أو رد على رسالة الشخص' },
            ]);
        }

        if (!amountArg) return ctx.error('اكتب المبلغ');
        const amount = Number(amountArg);
        if (!Number.isFinite(amount)) return ctx.error('المبلغ مش رقم');
        if (!Number.isInteger(amount)) return ctx.error('المبلغ لازم يكون رقم صحيح');
        if (amount <= 0) return ctx.error('المبلغ لازم > صفر');
        if (amount > MAX_AMOUNT) return ctx.error('المبلغ كبير جداً');

        const targetNumber = targetJid.split('@')[0].split(':')[0];
        if (targetNumber === ctx.senderNumber) return ctx.error('مش ممكن تحول لنفسك');

        const recipient = user.getOrCreate(targetJid);
        if (!recipient) return ctx.error('المستلم مش موجود');

        user.getOrCreate(ctx.sender, ctx.pushName);
        const senderBalance = user.getCoins(ctx.sender);
        if (senderBalance < amount) return ctx.error(`رصيدك مش كفاية\n\n رصيدك: ${senderBalance} 🪙`);

        const result = user.transferCoins(ctx.sender, targetJid, amount);
        if (!result.ok) return ctx.error('فشل التحويل');

        tracker.track(ctx.sender, 'transfer_count', 1);

        // ✅ XP للطرفين
        const senderXP = user.addXP(ctx.sender, 5);
        user.addXP(targetJid, 5);

        const newBalance = user.getCoins(ctx.sender);
        const recipientName = user.getDisplayName(targetJid, targetNumber);
        const levelMsg = senderXP && senderXP.leveledUp ? `\n     🎉 *ارتقيت للمستوى ${senderXP.level}!*` : '';

        await ctx.card('التحويل تم', [
            { emoji: '📤', title: 'المرسل', content: ` ${ctx.pushName}` },
            { emoji: '📥', title: 'المستلم', content: ` ${recipientName} (@${targetNumber})` },
            { emoji: '💸', title: 'المبلغ', content: ` ${amount} 🪙` },
            { emoji: '⭐', title: 'XP', content: ` +5 لك +5 للمستلم${levelMsg}` },
            { emoji: '🏦', title: 'رصيدك الجديد', content: ` ${newBalance} 🪙` },
        ], [targetJid]);
    }
};
