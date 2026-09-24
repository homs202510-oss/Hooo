const ex = require('./mod-exploration');
const kd = require('./mod-kingdom');
const user = require('./mod-user');

function bar(current, max, len = 10) {
    const filled = Math.min(len, Math.round((current / max) * len));
    return '█'.repeat(filled) + '░'.repeat(len - filled);
}

module.exports = {
    name: 'استكشاف',
    aliases: ['explore'],
    desc: 'استكشاف المناطق',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        const areaId = ctx.args[0];
        const areas = ex.getAllAreas();

        // عرض القائمة
        if (!areaId) {
            const list = areas.map(a => {
                const unlocked = ex.isAreaUnlocked(ctx.sender, a);
                const status = unlocked ? '✅' : '🔒';
                return `${status} ${a.emoji} *${a.name}*\n     Lv.${a.minLevel} • خطر ${a.dangers}\n     ⏱️ ${Math.floor(a.cooldown / 60)} دقيقة`;
            }).join('\n\n');

            return ctx.card('🗺️ الاستكشاف', [
                { emoji: '🌍', title: 'المناطق', content: list },
                { emoji: '💡', title: 'الطريقة', content: '.استكشاف [اسم المنطقة]\nمثال: .استكشاف forest' },
            ]);
        }

        const result = ex.explore(ctx.sender, areaId);

        if (!result.ok) {
            if (result.reason === 'unknown_area') return ctx.error(`منطقة "${areaId}" مش موجودة`);
            if (result.reason === 'locked') return ctx.error(`🔒 ${result.area.emoji} ${result.area.name} مقفولة\n\nمحتاج مستوى أعلى أو مملكة أقوى`);
            if (result.reason === 'global_cooldown') return ctx.error(`⏳ استنى ${result.wait} ثانية`);
            if (result.reason === 'area_cooldown') {
                const mins = Math.ceil(result.wait / 60);
                return ctx.error(`⏳ ${result.area.emoji} ${result.area.name}\n\nاستنى ${mins} دقيقة`);
            }
            return ctx.error('فشل الاستكشاف');
        }

        const rewardsList = [];
        for (const [type, amount] of Object.entries(result.gained)) {
            const info = kd.RESOURCE_LABELS[type];
            if (info) rewardsList.push(`${info.emoji} ${info.name}: +${amount}`);
        }
        if (result.coins) rewardsList.push(`💰 +${result.coins} نقطة`);
        rewardsList.push(`✨ +${result.xp} XP`);

        const blocks = [
            { emoji: result.area.emoji, title: result.area.name, content: 'رحلة ناجحة!' },
            { emoji: '🎁', title: 'المكافآت', content: rewardsList.join('\n') },
        ];

        if (result.items.length) {
            const itemsText = result.items.map(i => `${i.emoji} *${i.name}*`).join('\n');
            blocks.push({ emoji: '💎', title: 'عنصر نادر!', content: itemsText });
        }

        await ctx.card('🗺️ نتيجة الاستكشاف', blocks);
    }
};
