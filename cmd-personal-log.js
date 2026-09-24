const history = require('./mod-history');
const user = require('./mod-user');

const CAT_EMOJI = {
    auction: '🏷️', trade: '🛒', economy: '💰', bank: '🏦', investment: '📈',
    battle: '⚔️', mission: '🎯', achievement: '🏆', kingdom: '🏰',
    tax: '💸', treasury: '🏛️', factory: '🏭', build: '🏗️', upgrade: '📈',
    army: '🪖', war: '🔥', explore: '🗺️', project: '🏗️', agreement: '📜',
};

module.exports = {
    name: 'سجل',
    aliases: ['log', 'history'],
    desc: 'سجل أحداثك',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        const limit = parseInt(ctx.args[0]) || 15;

        const list = history.getRecent(ctx.sender, Math.min(limit, 30));

        if (!list.length) {
            return ctx.card('📜 السجل', [
                { emoji: '💭', title: 'مفيش أحداث', content: 'لسه معملتش أي حاجة' },
            ]);
        }

        const content = list.map(h => {
            const emoji = CAT_EMOJI[h.category] || '📌';
            const time = new Date(h.created_at * 1000).toLocaleString('ar-EG', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            const amountStr = h.amount ? ` (${h.amount > 0 ? '+' : ''}${h.amount})` : '';
            return `${emoji} *${h.action}*${amountStr}\n     ${h.details || ''}\n     ${time}`;
        }).join('\n\n');

        await ctx.card(`📜 السجل (${list.length})`, [
            { emoji: '📊', title: 'آخر الأحداث', content },
        ]);
    }
};
