/**
 * 🏭 .مصنع — نظام الإنتاج
 */
const factory = require('./mod-factory');
const kd = require('./mod-kingdom');
const user = require('./mod-user');

function fmtTime(sec) {
    if (sec <= 0) return '✅ جاهز';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}س ${m}د`;
    if (m > 0) return `${m}د ${s}ث`;
    return `${s}ث`;
}

module.exports = {
    name: 'مصنع',
    aliases: ['factory'],
    desc: 'مصنع المملكة',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const k = kd.getKingdom(ctx.sender);
        if (!k) return ctx.error('محتاج تنشئ مملكة الأول');

        const f = factory.get(k.id);
        const sub = ctx.args[0];

        // ترقية
        if (sub === 'ترقية' || sub === 'تطوير') {
            const cost = factory.getUpgradeCost(f.level);
            const result = factory.upgrade(k.id);
            if (!result.ok) {
                if (result.reason === 'max_level') return ctx.error('وصل لأقصى مستوى');
                if (result.reason === 'no_gold') return ctx.error(`محتاج ${cost} 🪙`);
                return ctx.error('فشل التطوير');
            }
            return ctx.card('✅ تم التطوير', [
                { emoji: '🏭', title: 'المستوى الجديد', content: `${result.newLevel}` },
                { emoji: '📊', title: 'السعة الجديدة', content: `${result.newCap} خط` },
            ]);
        }

        // بدء إنتاج
        if (sub === 'شغل' || sub === 'صنع') {
            const recipeId = ctx.args[1];
            const qty = parseInt(ctx.args[2]) || 1;

            if (!recipeId) {
                const recipes = factory.getRecipes();
                const list = Object.entries(recipes).map(([id, r]) => {
                    const inputs = Object.entries(r.inputs).map(([res, amt]) => `${kd.RESOURCE_LABELS[res]?.emoji || ''}${amt}`).join(' + ');
                    return `*${r.name}* (\`${id}\`)\n     💸 ${inputs}\n     ⏱️ ${Math.floor(r.timeSec / 60)} دقيقة`;
                }).join('\n\n');
                return ctx.card('🏭 الوصفات', [
                    { emoji: '📋', title: 'الوصفات المتاحة', content: list },
                    { emoji: '💡', title: 'الاستخدام', content: '.مصنع شغل [ID] [عدد]' },
                ]);
            }

            const result = factory.startProduction(k.id, recipeId, qty);
            if (!result.ok) {
                if (result.reason === 'unknown_recipe') return ctx.error('وصفة غير معروفة');
                if (result.reason === 'queue_full') return ctx.error(`الخطوط ممتلئة (${result.current}/${result.max})`);
                if (result.reason === 'no_resources') {
                    const missing = Object.entries(result.cost).map(([r, a]) => `${kd.RESOURCE_LABELS[r]?.emoji || ''} ${a}`).join(' + ');
                    return ctx.error(`موارد ناقصة: ${missing}`);
                }
                return ctx.error('فشل البدء');
            }

            return ctx.card('🏭 بدأ الإنتاج', [
                { emoji: '📦', title: 'المخرج', content: `${qty} وحدة` },
                { emoji: '⏰', title: 'الوقت', content: fmtTime(result.timeSec) },
                { emoji: '💡', title: 'استلم', content: 'المنتج بيضاف تلقائياً لما يخلص' },
            ]);
        }

        // العرض الافتراضي
        const queue = factory.getQueue(k.id);
        const queueContent = queue.length
            ? queue.map(q => {
                const recipe = factory.getRecipes()[q.recipe_id];
                const now = Math.floor(Date.now() / 1000);
                const rem = q.completes_at - now;
                return `${recipe ? recipe.name : q.recipe_id} × ${q.quantity}\n     ⏱️ ${fmtTime(rem)}`;
            }).join('\n\n')
            : 'مفيش إنتاج نشط';

        const recipes = factory.getRecipes();
        const recipesList = Object.entries(recipes).slice(0, 3).map(([id, r]) => `• ${r.name} (\`${id}\`)`).join('\n');

        await ctx.card('🏭 المصنع', [
            { emoji: '📊', title: `المستوى ${f.level}`, content: `خطوط: ${queue.length}/${f.capacity}` },
            { emoji: '⚙️', title: 'قيد الإنتاج', content: queueContent },
            { emoji: '📋', title: 'وصفات', content: recipesList },
            { emoji: '💡', title: 'أوامر', content: '.مصنع شغل [ID] [عدد]\n.مصنع ترقية' },
        ]);
    }
};
