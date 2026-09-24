const market = require('./mod-market');
const { RARITIES, MIN_PURCHASE_QTY } = require('./data-items');
const user = require('./mod-user');

module.exports = {
    name: 'سوق',
    aliases: ['market'],
    desc: 'واجهة السوق',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        market.refreshMarket();
        const items = market.getCurrentItems();
        const lastRefresh = market.getLastRefresh();
        const nextAt = lastRefresh + market.REFRESH_INTERVAL;
        const now = Math.floor(Date.now() / 1000);
        const mins = Math.floor(Math.max(0, nextAt - now) / 60);

        const sorted = [...items].sort((a, b) => {
            const rA = RARITIES[a.rarity].weight;
            const rB = RARITIES[b.rarity].weight;
            if (rA !== rB) return rA - rB;
            return b.price - a.price;
        });
        const top = sorted.slice(0, 3);

        const topContent = top.map(it => {
            const rar = RARITIES[it.rarity];
            return `${it.emoji} *${it.name}*\n     💰 ${it.price} نقطة  •  ${rar.emoji} ${rar.name}`;
        }).join('\n\n') || 'مفيش عناصر معروضة';

        const lastDate = lastRefresh ? new Date(lastRefresh * 1000).toLocaleString('ar-EG') : 'لسه';
        const purchases = market.getUserPurchaseCount(ctx.sender);

        await ctx.card('🛒 سوق PHANTOM', [
            { emoji: '📊', title: 'حالة السوق', content: `العناصر: ${items.length}\nآخر تحديث: ${lastDate}\nالقادم: بعد ${mins} دقيقة` },
            { emoji: '💎', title: 'أهم العناصر الآن', content: topContent },
            { emoji: '📋', title: 'الفئات', content: `${RARITIES.common.emoji} عادي  •  ${RARITIES.uncommon.emoji} غير شائع\n${RARITIES.rare.emoji} نادر  •  ${RARITIES.epic.emoji} ملحمي\n${RARITIES.legendary.emoji} أسطوري  •  ${RARITIES.mythic.emoji} نادر جدًا\n${RARITIES.special.emoji} فئة خاصة 👑` },
            { emoji: '⚔️', title: 'مشترياتك', content: `${purchases} عملية شراء\n${purchases >= 5 ? '✅ انت مؤهل للسيف المطوّر!' : `محتاج ${5 - purchases} كمان للسيف المطوّر`}` },
            { emoji: '💡', title: 'الأوامر', content: `.متجر — عرض العناصر\n.شراء [عنصر] [كمية ≥ ${MIN_PURCHASE_QTY}]\n.بيع [عنصر] [كمية]\n.اسعار — الأسعار الحالية` },
        ]);
    }
};
