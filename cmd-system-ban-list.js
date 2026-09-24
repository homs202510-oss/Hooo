/**
 * 📋 .المحظورين — عرض كل المحظورين
 */
const db = require('./core-database');
const user = require('./mod-user');
const dev = require('./mod-developer');

function extractNumber(jid) {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0];
}

module.exports = {
    name: 'المحظورين',
    aliases: ['banned', 'محظورين'],
    desc: 'عرض قائمة المحظورين',
    async run(ctx) {
        if (!user.isOwner(ctx.sender) && !dev.isDeveloper(ctx.sender)) {
            return ctx.error('الأمر ده للمطور بس 👑');
        }

        // ═══ جمع المحظورين من كل الجداول ═══
        const all = new Map(); // num → { reasons: [] }

        try {
            const rows = db.prepare('SELECT * FROM ai_blocks').all();
            for (const r of rows) {
                const n = extractNumber(r.user_jid);
                if (!all.has(n)) all.set(n, { num: n, reasons: [], jid: r.user_jid });
                all.get(n).reasons.push('AI: ' + (r.reason || 'بدون سبب'));
            }
        } catch (_) {}

        try {
            const rows = db.prepare("SELECT * FROM wa_blocks WHERE unblocked_at IS NULL").all();
            for (const r of rows) {
                const n = extractNumber(r.user_jid);
                if (!all.has(n)) all.set(n, { num: n, reasons: [], jid: r.user_jid });
                all.get(n).reasons.push('واتساب');
            }
        } catch (_) {}

        try {
            const rows = db.prepare("SELECT * FROM ai_moderation WHERE blocked_until > strftime('%s','now')").all();
            for (const r of rows) {
                const n = extractNumber(r.user_jid);
                if (!all.has(n)) all.set(n, { num: n, reasons: [], jid: r.user_jid });
                const days = Math.ceil((r.blocked_until - Math.floor(Date.now()/1000)) / 86400);
                all.get(n).reasons.push(`حظر أسبوع (باقي ${days} يوم)`);
            }
        } catch (_) {}

        if (!all.size) {
            return ctx.card('📋 المحظورين', [
                { emoji: '✅', title: 'قائمة فاضية', content: 'مفيش حد محظور حالياً' },
            ]);
        }

        const list = Array.from(all.values()).slice(0, 20);
        const content = list.map((x, i) => {
            return `${i + 1}. +${x.num}\n   └ ${x.reasons.join(' | ')}`;
        }).join('\n\n');

        const mentions = list.map(x => x.jid);

        await ctx.card('📋 المحظورين', [
            { emoji: '🚫', title: `العدد: ${all.size}`, content },
            { emoji: '💡', title: 'فك الحظر', content: '.فك [رقم]\n.فك الكل' },
        ], mentions);
    }
};
