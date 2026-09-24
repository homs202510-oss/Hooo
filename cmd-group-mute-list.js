/**
 * 🔇 .المكتومين
 */
const mod = require('./mod-group-moderation');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'المكتومين',
    aliases: ['mutelist'],
    desc: 'قائمة المكتومين',
    groupOnly: true,
    async run(ctx) {
        const mutes = mod.listMutes(ctx.jid);
        if (!mutes.length) return ctx.success('مفيش مكتومين');

        const content = mutes.slice(0, 20).map((m, i) => {
            return `${i + 1}. @${extractNumber(m.user_jid)}\n   └ ${m.reason || 'بدون سبب'}`;
        }).join('\n\n');

        const mentions = mutes.map(m => m.user_jid);

        await ctx.card('🔇 المكتومين', [
            { emoji: '📊', title: `العدد: ${mutes.length}`, content },
        ], mentions);
    }
};
