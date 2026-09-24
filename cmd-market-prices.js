const market = require('./mod-market');
const { RARITIES } = require('./data-items');
const user = require('./mod-user');

module.exports = {
    name: 'اسعار',
    aliases: ['prices'],
    desc: 'عرض الأسعار الحالية',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        market.refreshMarket();
        const marketItems = market.getCurrentItems();
        if (!marketItems.length) return ctx.error('السوق مش جاهز');

        const sorted = [...marketItems].sort((a, b) => a.price - b.price);
        const content = sorted.map(it => {
            const rar = RARITIES[it.rarity];
            const sellPrice = Math.max(1, Math.floor(it.price * rar.sellRate));
            const stockText = it.stock > 0 ? `📦 ${it.stock}` : '❌ نافذ';
            return `${it.emoji} *${it.name}*\n     شراء: 💰 ${it.price}  •  بيع: 💰 ${sellPrice}\n     ${rar.emoji} ${rar.name}  •  ${stockText}`;
        }).join('\n\n');

        await ctx.card('📊 أسعار السوق', [
            { emoji: '💰', title: 'الأسعار الحالية', content },
            { emoji: '💡', title: 'ملاحظة', content: 'الأسعار تتغير كل ساعة' },
        ]);
    }
};
