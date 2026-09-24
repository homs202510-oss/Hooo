/**
 * 👻 .خريطة — خريطة العالم
 */
const { getAllAreas } = require('./data-areas');
const { isAreaUnlocked } = require('./mod-exploration');
const user = require('./mod-user');

module.exports = {
    name: 'خريطة',
    aliases: ['map', 'مناطق'],
    desc: 'خريطة العالم',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        const areas = getAllAreas();
        const list = areas.map(a => {
            const unlocked = isAreaUnlocked(ctx.sender, a);
            const status = unlocked ? '✅ مفتوحة' : '🔒 مقفولة';
            return `${a.emoji} *${a.name}* — ${status}\n     Lv.${a.minLevel} • خطر ${a.dangers}\n     ⏱️ ${Math.floor(a.cooldown / 60)} دقيقة`;
        }).join('\n\n');

        const unlocked = areas.filter(a => isAreaUnlocked(ctx.sender, a)).length;

        await ctx.card('🗺️ خريطة العالم', [
            { emoji: '🌍', title: `المناطق (${unlocked}/${areas.length} مفتوحة)`, content: list },
            { emoji: '💡', title: 'الاستكشاف', content: '.استكشاف [اسم المنطقة]' },
        ]);
    }
};
