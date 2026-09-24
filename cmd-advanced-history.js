/**
 * 📜 .تاريخ — سجل اللاعب
 */
const history = require('./mod-history');
const user = require('./mod-user');
const { extractNumber } = require('./mod-jid');

const CAT_EMOJI = {
    auction: '🏷️', trade: '🛒', economy: '💰', bank: '🏦', investment: '📈',
    battle: '⚔️', mission: '🎯', achievement: '🏆', kingdom: '🏰',
    tax: '💸', treasury: '🏛️', factory: '🏭',
};

module.exports = {
    name: 'تاريخ',
    aliases: ['history', 'سجل'],
    desc: 'سجل اللاعب',
    async run(ctx) {
        let targetJid = ctx.sender;
        let isSelf = true;

        if (ctx.mentioned.length > 0) { targetJid = ctx.mentioned[0]; isSelf = false; }
        else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;
            isSelf = false;
        }

        user.getOrCreate(targetJid);
        const limit = parseInt(ctx.args[0]) || 10;

        const list = history.getRecent(targetJid, Math.min(limit, 30));

        if (!list.length) {
            return ctx.card('📜 السجل', [
                { emoji: '💭', title: 'مفيش سجل', content: 'لسه معملتش أي عملية' },
            ], isSelf ? [] : [targetJid]);
        }

        const content = list.map(h => {
            const emoji = CAT_EMOJI[h.category] || '📌';
            const time = new Date(h.created_at * 1000).toLocaleString('ar-EG', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            const amountStr = h.amount ? ` (${h.amount > 0 ? '+' : ''}${h.amount})` : '';
            return `${emoji} *${h.action}*${amountStr}\n     ${h.details || ''}\n     ${time}`;
        }).join('\n\n');

        await ctx.card(`📜 السجل (${list.length})`, [
            { emoji: '📊', title: 'آخر العمليات', content },
        ], isSelf ? [] : [targetJid]);
    }
};
