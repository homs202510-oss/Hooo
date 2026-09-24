const kd = require('./mod-kingdom');
const user = require('./mod-user');
const tracker = require('./mod-tracker');
const help = require('./util-help');

module.exports = {
    name: 'بناء',
    aliases: ['build'],
    desc: 'بناء مبنى',
    async run(ctx) {
        if (ctx.args[0] === 'شرح') {
            const h = help.getHelp('بناء');
            if (h) return ctx.card('شرح — بناء', help.buildHelpCard(h));
        }

        user.getOrCreate(ctx.sender, ctx.pushName);
        const k = kd.getKingdom(ctx.sender);
        if (!k) return ctx.error('محتاج تنشئ مملكة الأول');

        const buildingName = ctx.args.join(' ').trim();
        if (!buildingName) {
            const list = Object.entries(kd.BUILDINGS).map(([name, info]) => {
                const prod = kd.PRODUCTION[name] || {};
                const prodLines = Object.entries(prod).map(([res, amt]) => `${kd.RESOURCE_LABELS[res].emoji} +${amt}/س`).join(' ');
                const prodStr = prodLines ? `\n     ⚙️ ${prodLines}` : '';
                return `${info.emoji} *${name}*\n     ${info.desc}${prodStr}\n     💸 ${kd.formatCost(info.cost)}`;
            }).join('\n\n');

            return ctx.card('المباني المتاحة', [
                { emoji: '🏗️', title: 'الأنواع', content: list },
                { emoji: '💡', title: 'الطريقة', content: '.بناء [اسم المبنى]\nمثال: .بناء منزل' },
            ]);
        }

        const info = kd.BUILDINGS[buildingName];
        if (!info) return ctx.error(`مبنى "${buildingName}" غير معروف\n\nاكتب .بناء للقائمة`);

        if (!kd.canAfford(k.id, info.cost)) {
            const current = kd.getResources(k.id);
            const missing = Object.entries(info.cost)
                .filter(([type, amount]) => (current[type] || 0) < amount)
                .map(([type, amount]) => {
                    const lab = kd.RESOURCE_LABELS[type];
                    return `${lab.emoji} ${lab.name} : عندك ${current[type] || 0} / محتاج ${amount}`;
                }).join('\n');
            return ctx.card('موارد غير كافية', [
                { emoji: '❌', title: 'الناقص', content: missing },
                { emoji: '💸', title: 'التكلفة الكاملة', content: kd.formatCost(info.cost) },
            ]);
        }

        kd.deductCost(k.id, info.cost);
        kd.addBuilding(k.id, buildingName);

        // ✅ XP للبناء
        const result = user.addXP(ctx.sender, 20);
        const levelMsg = result && result.leveledUp ? `\n     🎉 *ارتقيت للمستوى ${result.level}!*` : '';

        const newRes = kd.getResources(k.id);
        const resNow = Object.entries(kd.RESOURCE_LABELS).map(([type, lab]) => `${lab.emoji} ${lab.name} : ${newRes[type] || 0}`).join('\n');

        await ctx.card('تم البناء ✅', [
            { emoji: info.emoji, title: buildingName, content: info.desc },
            { emoji: '💸', title: 'التكلفة', content: kd.formatCost(info.cost) },
            { emoji: '⭐', title: 'XP', content: ` +20${levelMsg}` },
            { emoji: '📦', title: 'الموارد الحالية', content: resNow },
        ]);
    }
};
