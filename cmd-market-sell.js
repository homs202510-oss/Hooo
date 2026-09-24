const market = require('./mod-market');
const { RARITIES } = require('./data-items');
const user = require('./mod-user');

module.exports = {
    name: 'بيع',
    aliases: ['sell'],
    desc: 'بيع عنصر من الحقيبة',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        const q = ctx.args[0];
        if (!q) {
            return ctx.card('البيع', [
                { emoji: '💡', title: 'الطريقة', content: '.بيع [اسم العنصر] [الكمية]\nمثال: .بيع خشب 10' },
                { emoji: '🎒', title: 'حقيبتك', content: '.حقيبة' },
                { emoji: '📌', title: 'ملاحظة', content: 'سعر البيع أقل من الشراء (60-80%)' },
            ]);
        }

        let qty = 1;
        let itemQuery = q;

        if (ctx.args.length > 1) {
            const maybeQty = parseInt(ctx.args[ctx.args.length - 1]);
            if (Number.isInteger(maybeQty) && maybeQty > 0) {
                qty = maybeQty;
                itemQuery = ctx.args.slice(0, -1).join(' ');
            }
        }

        if (/سيف.*مطور|sword_dev/i.test(itemQuery)) itemQuery = 'sword_dev';

        const item = market.findItemInInventory(ctx.sender, itemQuery);
        if (!item) return ctx.error(`مفيش "${itemQuery}" في حقيبتك\n\nاكتب .حقيبة لعرض ممتلكاتك`);

        const result = market.sell(ctx.sender, item.id, qty);

        if (!result.ok) {
            if (result.reason === 'no_item') return ctx.error(`عندك ${result.have || 0} بس من "${item.name}"`);
            return ctx.error('فشلت العملية، حاول تاني');
        }

        const rar = RARITIES[result.item.rarity];

        await ctx.card('تم البيع 💸', [
            { emoji: result.item.emoji, title: result.item.name, content: `${rar.emoji} ${rar.name}\nالكمية: ${result.qty}` },
            { emoji: '💰', title: 'المكسب', content: `${result.price} × ${result.qty} = ${result.total.toLocaleString('ar-EG')} نقطة` },
            { emoji: '💼', title: 'رصيدك الجديد', content: `${result.newBalance.toLocaleString('ar-EG')} نقطة` },
        ]);
    }
};
