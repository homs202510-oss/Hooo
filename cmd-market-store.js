const market = require('./mod-market');
const { RARITIES, SWORD_DEV_ID } = require('./data-items');
const user = require('./mod-user');

function formatItem(item, idx) {
    const rar = RARITIES[item.rarity];
    const num = String(idx + 1).padStart(2, '0');
    if (item.rarity === 'special') {
        return `✦ ${num} — ${item.emoji} *${item.name}* ${item.emoji}\n      💰 ${item.price} نقطة  •  📦 ${item.stock}\n      👑✨ أندر فئة 👑✨`;
    }
    return `${num} — ${item.emoji} *${item.name}*\n      💰 ${item.price} نقطة  •  ${rar.emoji} ${rar.name}  •  📦 ${item.stock}`;
}

module.exports = {
    name: 'متجر',
    aliases: ['store', 'shop'],
    desc: 'عرض المتجر الحالي',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const refreshResult = market.refreshMarket();
        const items = market.getCurrentItems();
        if (!items.length) return ctx.error('المتجر مش جاهز، حاول تاني');

        const swordOffer = market.getSwordDevOffer(ctx.sender);
        const content = items.map((it, i) => formatItem(it, i)).join('\n\n');
        const nextAt = refreshResult.nextAt || (market.getLastRefresh() + market.REFRESH_INTERVAL);
        const now = Math.floor(Date.now() / 1000);
        const mins = Math.floor(Math.max(0, nextAt - now) / 60);

        const blocks = [
            { emoji: '🛍️', title: `العناصر المعروضة (${items.length})`, content },
            { emoji: '⏰', title: 'التحديث القادم', content: `بعد ${mins} دقيقة` },
            { emoji: '💡', title: 'الشراء', content: '.شراء [اسم العنصر] [الكمية]\n⚠️ الحد الأدنى 10 للعناصر العادية، 1 للفئة الخاصة' },
        ];

        if (swordOffer && !swordOffer.owned) {
            blocks.push({
                emoji: '👑✨⚔️',
                title: '⚠️ سلاح الأسطورة متاح لك!',
                content: `*السيف المطوّر* 👑✨⚔️\nأقوى سلاح في PHANTOM\n💰 ${market.SWORD_DEV_PRICE.toLocaleString('ar-EG')} نقطة\n\nاكتب: .شراء السيف المطور`
            });
        }

        await ctx.card('🛒 متجر PHANTOM', blocks);
    }
};
