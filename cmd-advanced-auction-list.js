/**
 * 🏷️ .مزاد — عرض المزادات الحالية
 */
const auction = require('./mod-auction');
const user = require('./mod-user');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'مزاد',
    aliases: ['auction', 'auctions'],
    desc: 'عرض المزادات الحالية',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        await auction.settleExpired(ctx.sock);

        const list = auction.getActive();
        if (!list.length) {
            return ctx.card('🏷️ المزاد', [
                { emoji: '💭', title: 'مفيش مزادات', content: 'لسه مفيش عروض نشطة' },
                { emoji: '💡', title: 'ابدأ', content: '.عرض [عنصر] [كمية] [سعر]' },
            ]);
        }

        const now = Math.floor(Date.now() / 1000);
        const mentions = [];
        const content = list.slice(0, 8).map(a => {
            const sellerNum = extractNumber(a.seller_jid);
            mentions.push(a.seller_jid);
            const rem = a.ends_at - now;
            const h = Math.floor(rem / 3600);
            const m = Math.floor((rem % 3600) / 60);
            const bid = a.current_bid > 0 ? `${a.current_bid} (بواسطة @${extractNumber(a.highest_bidder)})` : 'مفيش';
            if (a.highest_bidder) mentions.push(a.highest_bidder);

            return `🆔 *#${a.id}* — ${a.item_name} × ${a.quantity}
     💰 البداية: ${a.start_price}
     🔨 أعلى: ${bid}
     ⏰ باقي: ${h}س ${m}د
     👤 البائع: @${sellerNum}`;
        }).join('\n\n');

        await ctx.card('🏷️ المزادات النشطة', [
            { emoji: '📊', title: `العدد: ${list.length}`, content },
            { emoji: '💡', title: 'للمزايدة', content: '.مزايدة [ID] [سعر]' },
        ], mentions);
    }
};
