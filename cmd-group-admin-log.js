/**
 * 📋 .سجل_الإدارة
 */
const logs = require('./mod-group-logs');
const perm = require('./mod-group-permissions');
const user = require('./mod-user');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'سجل_الإدارة',
    aliases: ['adminlog'],
    desc: 'سجل الإجراءات الإدارية',
    groupOnly: true,
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const permLevel = perm.level(ctx.sender, ctx.groupMetadata, ctx.sock.user?.id);
        if (permLevel === 'member') return ctx.error('الأمر ده للأدمن بس');

        const items = logs.getRecent(ctx.jid, 15);
        if (!items.length) return ctx.success('مفيش سجل بعد');

        const content = items.map(l => {
            const actor = l.actor_jid ? '@' + extractNumber(l.actor_jid) : '—';
            const target = l.target_jid ? '→ @' + extractNumber(l.target_jid) : '';
            const time = new Date(l.created_at * 1000).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            return `${time} • *${l.action}*\n${actor} ${target}`;
        }).join('\n\n');

        await ctx.card('📋 سجل الإدارة', [
            { emoji: '📜', title: `آخر ${items.length}`, content },
        ]);
    }
};
