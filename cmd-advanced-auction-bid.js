/**
 * 🔨 .مزايدة — مزايدة على مزاد
 */
const auction = require('./mod-auction');
const user = require('./mod-user');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'مزايدة',
    aliases: ['bid'],
    desc: 'مزايدة على مزاد',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        const id = parseInt(ctx.args[0]);
        const amount = parseInt(ctx.args[1]);

        if (!Number.isInteger(id) || id <= 0) return ctx.error('اكتب رقم المزاد');
        if (!Number.isInteger(amount) || amount <= 0) return ctx.error('اكتب مبلغ صحيح');

        const result = auction.bid(ctx.sender, id, amount);

        if (!result.ok) {
            if (result.reason === 'not_found') return ctx.error('مزاد غير موجود');
            if (result.reason === 'not_active') return ctx.error('المزاد مش نشط');
            if (result.reason === 'expired') return ctx.error('المزاد انتهى');
            if (result.reason === 'own_auction') return ctx.error('مش ممكن تزايد على مزادك');
            if (result.reason === 'already_highest') return ctx.error('انت بالفعل أعلى مزايد');
            if (result.reason === 'too_low') return ctx.error(`المزايدة لازم تكون ${result.minBid} على الأقل`);
            if (result.reason === 'no_coins') return ctx.error(`رصيدك مش كافي\n\nعندك: ${result.have}\nمحتاج: ${result.need}`);
            return ctx.error('فشل المزايدة');
        }

        const a = auction.getById(id);
        const newBal = user.getCoins(ctx.sender);

        await ctx.card('🔨 مزايدة ناجحة', [
            { emoji: '🆔', title: 'المزاد', content: `#${id}` },
            { emoji: '💰', title: 'مزايدتك', content: `${amount} نقطة` },
            { emoji: '💼', title: 'رصيدك', content: `${newBal} نقطة` },
            { emoji: '💡', title: 'ملاحظة', content: 'الفلوس محجوزة لحد ما المزاد يخلص' },
        ]);
    }
};
