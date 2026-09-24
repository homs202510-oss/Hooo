const adv = require('./mod-adventures');
const kd = require('./mod-kingdom');
const user = require('./mod-user');

module.exports = {
    name: 'مغامرة',
    aliases: ['adventure'],
    desc: 'خوض مغامرة',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        const arg = ctx.args[0];
        const all = adv.getAllAdventures();
        const state = adv.getState(ctx.sender);

        // في مغامرة نشطة
        if (state && !arg) {
            const ad = adv.getAllAdventures().find(a => a.id === state.adventure_id);
            if (!ad) { adv.clearState(ctx.sender); return ctx.error('حدث خطأ، ابدأ مغامرة جديدة'); }
            const step = ad.steps[state.step_index];
            if (!step) { adv.clearState(ctx.sender); return ctx.error('انتهت المغامرة'); }

            const choices = step.choices.map((c, i) => `${i + 1}. ${c.text}`).join('\n');
            return ctx.card(`🔥 ${ad.name}`, [
                { emoji: '📖', title: `الحدث ${state.step_index + 1}/${ad.steps.length}`, content: step.text },
                { emoji: '🎯', title: 'اختياراتك', content: choices },
                { emoji: '💡', title: 'اختر', content: `.مغامرة [رقم الاختيار]` },
            ]);
        }

        // اختيار رقم
        if (state && arg && /^[0-9]$/.test(arg)) {
            const choiceIdx = parseInt(arg) - 1;
            const result = adv.chooseOption(ctx.sender, choiceIdx);

            if (!result.ok) {
                if (result.reason === 'no_active') return ctx.error('مفيش مغامرة نشطة');
                if (result.reason === 'bad_choice') return ctx.error('اختيار غير صحيح');
                if (result.reason === 'need_army') return ctx.error(`محتاج ${result.need} جندي على الأقل`);
                return ctx.error('فشل الاختيار');
            }

            const eff = result.effect;
            const gains = [];
            if (eff.coins) gains.push(`💰 +${eff.coins}`);
            if (eff.xp) gains.push(`✨ +${eff.xp} XP`);
            if (eff.itemGained) gains.push(`💎 ${eff.itemGained.id} × ${eff.itemGained.qty}`);
            if (eff.armyLost) gains.push(`💀 فقدت ${eff.armyLost} جندي`);

            if (result.finished) {
                return ctx.card(`🏆 نهاية المغامرة`, [
                    { emoji: result.success ? '🎉' : '💀', title: 'النتيجة', content: result.success ? 'نجحت!' : 'فشلت!' },
                    { emoji: '🎁', title: 'المكاسب', content: gains.join('\n') || 'لا شيء' },
                ]);
            }

            const next = result.nextStep;
            const choices = next.choices.map((c, i) => `${i + 1}. ${c.text}`).join('\n');

            return ctx.card(`📖 ${result.adv.name}`, [
                { emoji: '✨', title: 'اختيارك السابق', content: gains.join('\n') || 'مفيش مكاسب' },
                { emoji: '📖', title: `الحدث ${result.stepIndex + 1}`, content: next.text },
                { emoji: '🎯', title: 'الاختيارات', content: choices },
                { emoji: '💡', title: 'اختر', content: `.مغامرة [رقم]` },
            ]);
        }

        // ابدأ مغامرة جديدة
        if (arg && !/^[0-9]$/.test(arg)) {
            const ad = all.find(a => a.id === arg);
            if (!ad) return ctx.error(`مغامرة "${arg}" مش موجودة`);

            const start = adv.startAdventure(ctx.sender, arg);
            if (!start.ok) {
                if (start.reason === 'level_low') return ctx.error(`محتاج مستوى ${start.need}`);
                if (start.reason === 'kingdom_low') return ctx.error(`محتاج مملكة مستوى ${start.need}`);
                return ctx.error('فشل البدء');
            }

            const choices = start.step.choices.map((c, i) => `${i + 1}. ${c.text}`).join('\n');
            return ctx.card(`🔥 ${ad.name}`, [
                { emoji: '📖', title: `الحدث 1/${ad.steps.length}`, content: start.step.text },
                { emoji: '🎯', title: 'اختياراتك', content: choices },
                { emoji: '💡', title: 'اختر', content: `.مغامرة [رقم]` },
            ]);
        }

        // قائمة المغامرات
        const list = all.map(a => {
            return `${a.emoji} *${a.name}*\n     Lv.${a.minLevel} • خطر ${a.danger}\n     📖 ${a.steps.length} خطوات`;
        }).join('\n\n');

        await ctx.card('🔥 المغامرات', [
            { emoji: '🗺️', title: 'المتاحة', content: list },
            { emoji: '💡', title: 'الطريقة', content: '.مغامرة [ID]\nمثال: .مغامرة a_forest' },
        ]);
    }
};
