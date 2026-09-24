const m = require('./mod-missions');
const { DIFF, TYPES } = require('./data-missions');
const user = require('./mod-user');

function bar(p, t) {
    const percent = Math.min(100, Math.floor((p / t) * 100));
    return '█'.repeat(Math.floor(percent / 10)) + '░'.repeat(10 - Math.floor(percent / 10)) + ' ' + percent + '%';
}

module.exports = {
    name: 'مهمة',
    aliases: ['mission'],
    desc: 'عرض/بدء مهمة',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        const arg = ctx.args[0];

        // لو رقم → مهمة معينة
        if (arg && !isNaN(arg)) {
            const id = parseInt(arg);
            const mission = require('./data-missions').getMission(id);
            if (!mission) return ctx.error(`مهمة #${id} مش موجودة`);

            if (!m.isUnlocked(ctx.sender, id)) {
                const reqNames = mission.requires.map(rid => {
                    const r = require('./data-missions').getMission(rid);
                    return r ? r.name : `#${rid}`;
                }).join(', ');
                return ctx.card(`🔒 مهمة #${id} مقفولة`, [
                    { emoji: '📌', title: mission.name, content: `محتاج تخلّص: ${reqNames}` },
                ]);
            }

            m.startMission(ctx.sender, id);
            m.updateProgress(ctx.sender);
            const row = m.getMissionRow(ctx.sender, id);
            const d = DIFF[mission.difficulty];
            const t = TYPES[mission.type];

            const rewards = [];
            if (mission.rewards.coins) rewards.push(`💰 ${mission.rewards.coins}`);
            if (mission.rewards.xp) rewards.push(`✨ ${mission.rewards.xp} XP`);
            if (mission.rewards.resources) {
                for (const [k, v] of Object.entries(mission.rewards.resources)) rewards.push(`${k}: ${v}`);
            }

            return ctx.card(`🎯 ${mission.name}`, [
                { emoji: t.emoji, title: 'النوع', content: `${t.name} • ${d.emoji} ${d.name}` },
                { emoji: '📋', title: 'المطلوب', content: `${bar(row.progress, mission.target)}\n${row.progress} / ${mission.target}` },
                { emoji: '🎁', title: 'المكافآت', content: rewards.join('\n') },
                { emoji: row.status === 'completed' ? '✅' : '⏳', title: 'الحالة', content: row.status === 'completed' ? 'مكتملة — استلم بـ .مكافأة' : 'قيد التقدم' },
            ]);
        }

        // عرض المهمة النشطة
        const suggested = m.getNextSuggested(ctx.sender);
        if (!suggested || !suggested.mission) {
            return ctx.card('🎯 المهمة', [
                { emoji: '💭', title: 'مفيش مهمة', content: 'اكتب .مهام لعرض القائمة' },
            ]);
        }

        const mission = suggested.mission;
        const row = suggested.row || m.getMissionRow(ctx.sender, mission.id);
        const d = DIFF[mission.difficulty];
        const t = TYPES[mission.type];

        const rewards = [];
        if (mission.rewards.coins) rewards.push(`💰 ${mission.rewards.coins}`);
        if (mission.rewards.xp) rewards.push(`✨ ${mission.rewards.xp} XP`);

        await ctx.card(`🎯 ${mission.name}`, [
            { emoji: t.emoji, title: `#${mission.id} — ${t.name}`, content: `${d.emoji} ${d.name}` },
            { emoji: '📋', title: 'المطلوب', content: row ? `${bar(row.progress, mission.target)}\n${row.progress} / ${mission.target}` : `0 / ${mission.target}` },
            { emoji: '🎁', title: 'المكافآت', content: rewards.join('\n') },
            { emoji: '💡', title: 'ملاحظة', content: 'اكتب .مهام لعرض الكل\nاكتب .مكافأة للاستلام' },
        ]);
    }
};
