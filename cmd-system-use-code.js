/**
 * 🎁 .استخدم CODE — استخدام كود مكافأة
 */
const rewards = require('./mod-group-rewards');
const user = require('./mod-user');

module.exports = {
    name: 'استخدم',
    aliases: ['use', 'redeem'],
    desc: 'استخدام كود مكافأة',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        const code = ctx.args[0];
        if (!code) return ctx.error('اكتب: .استخدم [الكود]');

        const row = rewards.lookup(code);
        if (!row) return ctx.error('كود غير موجود');

        // محاولة الاستخدام
        const result = rewards.redeem(code, ctx.sender);
        if (!result.ok) {
            if (result.reason === 'not_found') return ctx.error('كود غير موجود');
            if (result.reason === 'expired') return ctx.error('الكود انتهت صلاحيته ❌');
            if (result.reason === 'already_used') return ctx.error('انت استخدمت الكود ده قبل كده ❌');
            if (result.reason === 'inactive') return ctx.error('الكود مش شغال');
            return ctx.error('فشل الاستخدام');
        }

        // منح المكافأة
        const granted = await rewards.grant(result.code, ctx.sender);

        if (granted.error === 'no_kingdom') {
            return ctx.error('محتاج تنشئ مملكة الأول عشان تستقبل المكافأة');
        }

        const typeLabels = { points: 'نقطة 🪙', wood: 'خشب 🪵', stone: 'حجر 🪨', iron: 'حديد ⛓️', food: 'طعام 🌾', gold: 'ذهب 🪙' };
        const label = typeLabels[granted.type] || granted.type;

        await ctx.card('🎁 مبروك!', [
            { emoji: '✅', title: 'الكود', content: `تم استخدامه بنجاح` },
            { emoji: '🎯', title: 'المكافأة', content: `+${granted.value} ${label}` },
            { emoji: '📊', title: 'باقي استخدامات الكود', content: `${result.code.max_uses - result.code.used_count - 1}` },
        ]);

        console.log(`🎁 ${ctx.sender} used code ${code}`);
    }
};
