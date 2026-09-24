const kd = require('./mod-kingdom');
const user = require('./mod-user');
const help = require('./util-help');

module.exports = {
    name: 'تطوير',
    aliases: ['upgrade'],
    desc: 'تطوير المملكة',
    async run(ctx) {
        if (ctx.args[0] === 'شرح') {
            const h = help.getHelp('تطوير');
            if (h) return ctx.card('شرح — تطوير', help.buildHelpCard(h));
        }

        user.getOrCreate(ctx.sender, ctx.pushName);
        const k = kd.getKingdom(ctx.sender);
        if (!k) return ctx.error('محتاج تنشئ مملكة الأول');

        const cost = kd.getUpgradeCost(k.id, k.level);
        if (!ctx.args[0] || ctx.args[0] !== 'تأكيد') {
            const current = kd.getResources(k.id);
            const canDo = kd.canAfford(k.id, cost);
            const costLines = Object.entries(cost).map(([type, amount]) => {
                const lab = kd.RESOURCE_LABELS[type];
                const have = current[type] || 0;
                const mark = have >= amount ? '✅' : '❌';
                return `${mark} ${lab.emoji} ${lab.name} : ${amount} (عندك ${have})`;
            }).join('\n');
            return ctx.card('تطوير المملكة', [
                { emoji: '📈', title: 'المستوى', content: `الحالي: ${k.level} → التالي: ${k.level + 1}` },
                { emoji: '⚔️', title: 'القوة الحالية', content: `${k.power}` },
                { emoji: '💸', title: 'التكلفة', content: costLines },
                { emoji: '💡', title: 'التأكيد', content: canDo ? 'اكتب: .تطوير تأكيد' : '❌ مواردك مش كافية' },
            ]);
        }

        const result = kd.upgradeKingdom(k.id);
        if (!result.ok) {
            if (result.reason === 'insufficient') return ctx.error('مواردك مش كافية');
            return ctx.error('فشل التطوير');
        }

        // ✅ XP للتطوير
        const xpResult = user.addXP(ctx.sender, 50);
        const levelMsg = xpResult && xpResult.leveledUp ? `\n     🎉 *ارتقيت للمستوى ${xpResult.level}!*` : '';

        const updated = kd.getKingdom(ctx.sender);
        await ctx.card('تم التطوير! 🎉', [
            { emoji: '🏰', title: k.name, content: `المستوى الجديد: ${updated.level}` },
            { emoji: '⚔️', title: 'القوة الجديدة', content: `${updated.power}` },
            { emoji: '⭐', title: 'XP', content: ` +50${levelMsg}` },
        ]);
    }
};
