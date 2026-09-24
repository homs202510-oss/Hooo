/**
 * 🚫 .المحظورين_جروب
 */
const mod = require('./mod-group-moderation');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'المحظورين_جروب',
    aliases: ['gbanlist'],
    desc: 'قائمة محظوري الجروب',
    groupOnly: true,
    async run(ctx) {
        const bans = mod.listBans(ctx.jid);
        if (!bans.length) return ctx.success('مفيش محظورين');

        const content = bans.slice(0, 20).map((b, i) => {
            return `${i + 1}. @${extractNumber(b.user_jid)}\n   └ ${b.reason || 'بدون سبب'}`;
        }).join('\n\n');

        const mentions = bans.map(b => b.user_jid);

        await ctx.card('🚫 المحظورين', [
            { emoji: '📊', title: `العدد: ${bans.length}`, content },
        ], mentions);
    }
};
