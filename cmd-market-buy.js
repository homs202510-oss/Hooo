const market = require('./mod-market');
const { RARITIES, SWORD_DEV_ID, MIN_PURCHASE_QTY } = require('./data-items');
const user = require('./mod-user');
const req = require('./svc-requirements');

module.exports = {
    name: 'شراء',
    aliases: ['buy'],
    desc: 'شراء عنصر من السوق',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        const q = ctx.args[0];
        if (!q) {
            return ctx.card('🛒 الشراء', [
                { emoji: '💡', title: 'الطريقة', content: '.شراء [اسم العنصر] [الكمية]\nمثال: .شراء خشب 10' },
                { emoji: '⚠️', title: 'الحد الأدنى', content: `10 للعناصر العادية\n1 للفئة الخاصة (👑✨)` },
                { emoji: '🛒', title: 'المتجر', content: '.متجر' },
            ]);
        }

        let qty = 1;
        let itemQuery = q;
        let qtyGiven = false;

        if (ctx.args.length > 1) {
            const maybeQty = parseInt(ctx.args[ctx.args.length - 1]);
            if (Number.isInteger(maybeQty) && maybeQty > 0) {
                qty = maybeQty;
                itemQuery = ctx.args.slice(0, -1).join(' ');
                qtyGiven = true;
            }
        }

        if (/سيف.*مطور|sword_dev|المطور/i.test(itemQuery)) itemQuery = SWORD_DEV_ID;

        const item = market.findItem(itemQuery);
        if (!item) return ctx.error(`مفيش عنصر "${itemQuery}"\n\nاكتب .متجر`);

        if (item.rarity === 'special') {
            if (qty !== 1) return ctx.error('الفئة الخاصة تُشترى بقطعة واحدة فقط');
        } else {
            if (!qtyGiven) qty = MIN_PURCHASE_QTY;
            if (qty < MIN_PURCHASE_QTY) return ctx.error(`الحد الأدنى ${MIN_PURCHASE_QTY} للعناصر العادية`);
        }

        market.refreshMarket();
        const result = market.buy(ctx.sender, item.id, qty);

        if (!result.ok) {
            if (result.reason === 'sword_locked') {
                return ctx.card('🔒 السيف المطوّر مقفول', [
                    { emoji: '⚠️', title: 'الشرط', content: `مشتريات من المتجر: ${result.have}/${result.need}` },
                    { emoji: '💡', title: 'الحل', content: 'اشتري 5 مرات على الأقل من .متجر' },
                ]);
            }
            if (result.reason === 'sword_owned') return ctx.error('انت تملك السيف المطوّر بالفعل 👑');
            if (result.reason === 'not_in_market') return ctx.error(`"${item.name}" مش معروض حالياً`);
            if (result.reason === 'no_stock') return ctx.error(`المتاح ${result.stock} بس`);
            if (result.reason === 'insufficient') {
                const missing = result.needed - result.has;
                const percent = Math.floor((result.has / result.needed) * 100);
                return ctx.card('🚫 رصيدك مش كافي', [
                    { emoji: '💰', title: 'السعر', content: `${result.needed.toLocaleString('ar-EG')} 🪙` },
                    { emoji: '💼', title: 'رصيدك', content: `${result.has.toLocaleString('ar-EG')} 🪙 (${percent}%)` },
                    { emoji: '📉', title: 'الناقص', content: `${missing.toLocaleString('ar-EG')} 🪙` },
                    { emoji: '💡', title: 'كسب النقاط', content: '• .يومي — مكافأة يومية\n• .عمل — كل ساعة\n• .توب\n• .بيع [عنصر]' },
                    { emoji: '🛒', title: 'بديل', content: 'جرب عنصر أرخص بـ .متجر' },
                ]);
            }
            return ctx.error('فشلت العملية');
        }

        if (result.isSwordDev) {
            let allMembers = [];
            if (ctx.isGroup) {
                try { const meta = await ctx.sock.groupMetadata(ctx.jid); allMembers = meta.participants.map(p => p.id); } catch (_) {}
            }
            const announce = `👑✨⚔️ *إعلان أسطوري* ⚔️✨👑\n\n🔥 *@${ctx.senderNumber}* اشترى *السيف المطوّر*!\n\n👑✨⚔️ أندر سلاح في PHANTOM ⚔️✨👑\n💰 بـ *${market.SWORD_DEV_PRICE.toLocaleString('ar-EG')} نقطة*\n⚔️ هجوم +10,000\n🛡️ دفاع +8,000\n\n👻 *${ctx.pushName}* أصبح أسطورة!`;
            await ctx.sock.sendMessage(ctx.jid, { text: announce, mentions: [ctx.sender, ...allMembers] });
            return;
        }

        const rar = RARITIES[result.item.rarity];
        const labels = { attack: '⚔️', defense: '🛡️', speed: '💨', energy: '⚡', growth: '🌱', maxArmy: '🎖️', lootBonus: '💰', buildSpeed: '🏗️', prodWood: '🪵', prodStone: '🪨', prodFood: '🌾', prodIron: '⛓️', prodGold: '🪙' };
        const bonusesText = Object.entries(result.item.bonuses || {})
            .map(([k, v]) => `${labels[k] || k}: +${v}`).join('\n');

        await ctx.card('✅ تم الشراء', [
            { emoji: result.item.emoji, title: result.item.name, content: `${rar.emoji} ${rar.name}\nالكمية: ${result.qty}` },
            { emoji: '💸', title: 'التكلفة', content: `${result.price} × ${result.qty} = ${result.total.toLocaleString('ar-EG')} 🪙` },
            { emoji: '💼', title: 'رصيدك الجديد', content: `${result.newBalance.toLocaleString('ar-EG')} 🪙` },
            ...(bonusesText ? [{ emoji: '✨', title: 'الفوايد', content: bonusesText }] : []),
        ]);
    }
};
