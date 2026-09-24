/**
 * 💸 .ضريبة — ضريبة المملكة
 */
const tax = require('./mod-tax');
const kd = require('./mod-kingdom');
const user = require('./mod-user');
const balance = require('./mod-balance-advanced').tax;

module.exports = {
    name: 'ضريبة',
    aliases: ['tax'],
    desc: 'ضريبة المملكة',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const k = kd.getKingdom(ctx.sender);
        if (!k) return ctx.error('محتاج تنشئ مملكة الأول');

        const t = tax.get(k.id);
        const expected = tax.calculateExpectedIncome(k.id);
        const sub = ctx.args[0];

        // تغيير
        if (sub === 'عدل' || sub === 'غير') {
            if (k.owner_jid !== ctx.sender) return ctx.error('الأمر ده لصاحب المملكة بس');
            const newRate = parseInt(ctx.args[1]);
            if (!Number.isInteger(newRate)) return ctx.error('اكتب نسبة صحيحة');

            const result = tax.set(k.id, newRate, ctx.sender);
            if (!result.ok) {
                if (result.reason === 'bad_rate') return ctx.error(`النسبة لازم بين ${result.min} و ${result.max}`);
                if (result.reason === 'cooldown') {
                    const h = Math.ceil(result.wait / 3600);
                    return ctx.error(`استنى ${h} ساعة قبل التغيير`);
                }
                return ctx.error('فشل التعديل');
            }

            return ctx.card('✅ تم تعديل الضريبة', [
                { emoji: '💸', title: 'النسبة الجديدة', content: `${result.rate}%` },
                { emoji: '💰', title: 'الدخل المتوقع', content: `${expected.income} 🪙/س` },
            ]);
        }

        await ctx.card('💸 ضريبة المملكة', [
            { emoji: '📊', title: 'النسبة الحالية', content: `${t.rate}%` },
            { emoji: '💰', title: 'الدخل المتوقع', content: `${expected.income.toLocaleString('ar-EG')} 🪙/س` },
            { emoji: '📈', title: 'قيمة الإنتاج', content: `${expected.totalValue.toLocaleString('ar-EG')} 🪙/س` },
            { emoji: '📉', title: 'الحدود', content: `${balance.min}% - ${balance.max}%` },
            { emoji: '💡', title: 'التعديل', content: '.ضريبة عدل [نسبة]' },
        ]);
    }
};
