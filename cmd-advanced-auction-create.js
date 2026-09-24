/**
 * 🏷️ .عرض — إنشاء مزاد
 */
const auction = require('./mod-auction');
const market = require('./mod-market');
const user = require('./mod-user');

module.exports = {
    name: 'عرض',
    aliases: ['sell-auction', 'list'],
    desc: 'إنشاء عرض في المزاد',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        const args = ctx.args;
        if (args.length < 3) {
            return ctx.card('🏷️ إنشاء مزاد', [
                { emoji: '📌', title: 'الاستخدام', content: '.عرض [اسم العنصر] [الكمية] [سعر البداية]\nمثال: .عرض خشب 10 500' },
                { emoji: '💡', title: 'ملاحظة', content: '⚠️ الكمية بتتحجز من حقيبتك لحد ما المزاد يخلص' },
            ]);
        }

        const startPrice = parseInt(args[args.length - 1]);
        const quantity = parseInt(args[args.length - 2]);
        const itemQuery = args.slice(0, -2).join(' ').trim();

        if (!Number.isInteger(quantity) || quantity <= 0) return ctx.error('كمية غير صحيحة');
        if (!Number.isInteger(startPrice) || startPrice <= 0) return ctx.error('سعر غير صحيح');

        const item = market.findItemInInventory(ctx.sender, itemQuery);
        if (!item) return ctx.error(`مفيش "${itemQuery}" في حقيبتك`);

        const inv = user.getInventoryItem(ctx.sender, item.id);
        if (!inv || inv.quantity < quantity) {
            return ctx.error(`عندك ${inv ? inv.quantity : 0} بس من ${item.name}`);
        }

        const result = auction.create(ctx.sender, item.category, item.id, item.name, quantity, startPrice);
        if (!result.ok) {
            if (result.reason === 'too_many_active') return ctx.error('عندك مزادات كتير نشطة (حد أقصى 5)');
            if (result.reason === 'bad_price') return ctx.error('سعر البداية غير مناسب');
            if (result.reason === 'bad_quantity') return ctx.error('كمية غير مناسبة');
            if (result.reason === 'no_item') return ctx.error('مش معاك الكمية دي');
            return ctx.error('فشل الإنشاء');
        }

        const endsDate = new Date(result.endsAt * 1000);
        await ctx.card('✅ تم إنشاء المزاد', [
            { emoji: '🆔', title: 'رقم المزاد', content: `#${result.auctionId}` },
            { emoji: item.emoji, title: 'العنصر', content: `${item.name} × ${quantity}` },
            { emoji: '💰', title: 'سعر البداية', content: `${startPrice} نقطة` },
            { emoji: '⏰', title: 'ينتهي', content: endsDate.toLocaleString('ar-EG') },
            { emoji: '💡', title: 'ملاحظة', content: 'تم حجز الكمية من حقيبتك لحد ما المزاد يخلص' },
        ]);
    }
};
