const kd = require('./mod-kingdom');
const mil = require('./mod-military');
const user = require('./mod-user');
const req = require('./svc-requirements');

module.exports = {
    name: 'تجنيد',
    aliases: ['recruit'],
    desc: 'تجنيد وحدات عسكرية',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        // ═══ فحص المتطلبات ═══
        const checks = req.check(ctx.sender, [
            { type: 'has_kingdom' },
            { type: 'building', name: 'ثكنة', value: 1 },
        ]);

        if (!checks.allowed) {
            const missing = req.buildMissingMessage(checks.results);
            return ctx.card('🚫 مش جاهز للجيش', [
                { emoji: '❌', title: 'الناقص', content: missing },
                { emoji: '📌', title: 'الخطوات', content: '1. .إنشاء [اسم] — مملكة\n2. .بناء ثكنة — المنشأة العسكرية\n3. بعدها ترجع .تجنيد' },
                { emoji: '💡', title: 'تلميح', content: 'الثكنة بتحدد سعة الجيش' },
            ]);
        }

        const k = checks.state.kingdom;
        const type = ctx.args[0];
        const qty = parseInt(ctx.args[1]);

        // عرض الأنواع
        if (!type) {
            const list = Object.entries(mil.UNIT_TYPES).map(([name, u]) => {
                const cost = Object.entries(u.cost).map(([r, a]) => `${kd.RESOURCE_LABELS[r]?.emoji || ''} ${a}`).join(' + ');
                return `${u.emoji} *${name}*\n     ${u.desc}\n     ⚔️${u.attack} 🛡️${u.defense} 💨${u.speed}\n     💸 ${cost} + ${u.coins} 🪙`;
            }).join('\n\n');
            const max = mil.getMaxArmy(k.id);
            const current = mil.getArmyCount(k.id);
            return ctx.card('🎯 تجنيد', [
                { emoji: '⚔️', title: 'الأنواع', content: list },
                { emoji: '📊', title: 'الجيش', content: `${current} / ${max}` },
                { emoji: '💡', title: 'الاستخدام', content: '.تجنيد [النوع] [العدد]' },
            ]);
        }

        if (!mil.UNIT_TYPES[type]) return ctx.error(`نوع "${type}" مش معروف`);
        if (!qty || qty <= 0) return ctx.error('اكتب عدد صحيح');
        if (qty > 500) return ctx.error('الحد الأقصى 500');

        const result = mil.recruit(k.id, ctx.sender, type, qty);

        if (!result.ok) {
            if (result.reason === 'capacity') {
                return ctx.card('🚫 السعة ممتلئة', [
                    { emoji: '⚠️', title: 'السعة الحالية', content: `${result.current}/${result.max}` },
                    { emoji: '📌', title: 'الحلول', content: '1. .بناء ثكنة — يزود السعة +10\n2. .بناء ثكنة (كررها للمزيد)\n3. العناصر النادرة بتزود السعة' },
                ]);
            }
            if (result.reason === 'insufficient') {
                const current = kd.getResources(k.id);
                const missing = Object.entries(result.cost)
                    .filter(([r, a]) => (current[r] || 0) < a)
                    .map(([r, a]) => `${kd.RESOURCE_LABELS[r]?.emoji || ''} ${kd.RESOURCE_LABELS[r]?.name || r}: عندك ${current[r] || 0} / محتاج ${a}`)
                    .join('\n');
                return ctx.card('🚫 موارد غير كافية', [
                    { emoji: '❌', title: 'الناقص', content: missing },
                    { emoji: '💡', title: 'الحلول', content: '• .بناء مزرعة/منجم — إنتاج موارد\n• .جمع — موارد سريعة\n• .شراء [مورد] — من السوق' },
                ]);
            }
            if (result.reason === 'no_coins') {
                return ctx.card('🚫 رصيدك مش كافي', [
                    { emoji: '💰', title: 'النقاط', content: `عندك: ${result.have} 🪙\nمحتاج: ${result.need} 🪙` },
                    { emoji: '💡', title: 'كسب النقاط', content: '• .يومي\n• .عمل\n• .توب\n• .بيع [عنصر]' },
                ]);
            }
            return ctx.error('فشل التجنيد');
        }

        const def = mil.UNIT_TYPES[type];
        const xpGain = qty * 2;
        user.addXP(ctx.sender, xpGain);

        const tracker = require('./mod-tracker');
        tracker.track(ctx.sender, 'train_count', 1);

        const costLines = Object.entries(result.cost).map(([r, a]) => `${kd.RESOURCE_LABELS[r]?.emoji || ''} ${a}`).join(' + ');

        await ctx.card('⚔️ تم التجنيد!', [
            { emoji: def.emoji, title: type, content: `العدد: ${qty}` },
            { emoji: '💸', title: 'التكلفة', content: `${costLines}\n${result.coins} 🪙` },
            { emoji: '⭐', title: 'XP', content: `+${xpGain}` },
            { emoji: '💼', title: 'رصيدك', content: `${result.newBalance.toLocaleString('ar-EG')} 🪙` },
        ]);
    }
};
