/**
 * 🏛️ .خزينة — خزينة المملكة
 */
const treasury = require('./mod-treasury');
const kd = require('./mod-kingdom');
const user = require('./mod-user');

module.exports = {
    name: 'خزينة',
    aliases: ['treasury'],
    desc: 'خزينة المملكة',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const k = kd.getKingdom(ctx.sender);
        if (!k) return ctx.error('محتاج تنشئ مملكة الأول');

        const sub = ctx.args[0];

        // إيداع
        if (sub === 'ايداع' || sub === 'إيداع') {
            const amount = parseInt(ctx.args[1]);
            if (!Number.isInteger(amount) || amount <= 0) return ctx.error('اكتب مبلغ صحيح');

            const bal = user.getCoins(ctx.sender);
            if (bal < amount) return ctx.error(`رصيدك مش كافي (${bal})`);

            try {
                const userMod = require('./mod-user');
                const { DatabaseSync } = require('node:sqlite');
                const db = require('./core-database');

                db.exec('BEGIN IMMEDIATE');
                userMod.removeCoins(ctx.sender, amount);
                db.exec('COMMIT');
            } catch (_) {}

            const result = treasury.deposit(k.id, amount, ctx.sender, 'إيداع يدوي');
            if (!result.ok) return ctx.error('فشل الإيداع');

            return ctx.card('🏛️ إيداع', [
                { emoji: '💸', title: 'المبلغ', content: `${amount} 🪙` },
                { emoji: '💰', title: 'رصيد الخزينة', content: `${result.balance.toLocaleString('ar-EG')}` },
            ]);
        }

        // سحب
        if (sub === 'سحب') {
            if (k.owner_jid !== ctx.sender) return ctx.error('الأمر ده لصاحب المملكة بس');
            const amount = parseInt(ctx.args[1]);
            if (!Number.isInteger(amount) || amount <= 0) return ctx.error('اكتب مبلغ صحيح');

            const result = treasury.withdraw(k.id, amount, ctx.sender, 'سحب يدوي');
            if (!result.ok) {
                if (result.reason === 'min_withdraw') return ctx.error(`الحد الأدنى للسحب ${result.min}`);
                if (result.reason === 'no_balance') return ctx.error('الخزينة مش كافي');
                return ctx.error('فشل السحب');
            }

            // ضيف للاعب (ناقص رسوم)
            user.addCoins(ctx.sender, result.net);

            return ctx.card('🏛️ سحب', [
                { emoji: '💸', title: 'المبلغ', content: `${amount} 🪙` },
                { emoji: '💰', title: 'رسوم', content: `${result.fee} 🪙` },
                { emoji: '💵', title: 'استلمت', content: `${result.net} 🪙` },
                { emoji: '🏦', title: 'رصيد الخزينة', content: `${result.newBalance.toLocaleString('ar-EG')}` },
            ]);
        }

        // عرض
        const t = treasury.get(k.id);
        const logs = treasury.getLogs(k.id, 5);
        const logsContent = logs.length
            ? logs.map(l => {
                const emoji = l.action === 'deposit' ? '⬆️' : '⬇️';
                const time = new Date(l.created_at * 1000).toLocaleDateString('ar-EG');
                return `${emoji} ${l.action}: ${l.amount} (${time})`;
            }).join('\n')
            : 'مفيش عمليات';

        await ctx.card('🏛️ خزينة المملكة', [
            { emoji: '💰', title: 'الرصيد الحالي', content: `${t.balance.toLocaleString('ar-EG')} 🪙` },
            { emoji: '📈', title: 'إجمالي الدخل', content: `${t.total_income.toLocaleString('ar-EG')}` },
            { emoji: '📉', title: 'إجمالي المصروفات', content: `${t.total_expense.toLocaleString('ar-EG')}` },
            { emoji: '📜', title: 'آخر العمليات', content: logsContent },
            { emoji: '💡', title: 'أوامر', content: '.خزينة ايداع [مبلغ]\n.خزينة سحب [مبلغ]' },
        ]);
    }
};
