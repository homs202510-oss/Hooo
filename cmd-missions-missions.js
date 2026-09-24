const m = require('./mod-missions');
const { DIFF, TYPES } = require('./data-missions');
const user = require('./mod-user');

function progressBar(p, t) {
    const percent = Math.min(100, Math.floor((p / t) * 100));
    const filled = Math.floor(percent / 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled) + ' ' + percent + '%';
}

module.exports = {
    name: 'مهام',
    aliases: ['missions'],
    desc: 'عرض المهام',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const list = m.getAvailable(ctx.sender);

        const blocks = [];

        if (list.active.length) {
            const content = list.active.slice(0, 5).map(x => {
                const d = DIFF[x.mission.difficulty];
                return `${d.emoji} *${x.mission.name}*\n     ${progressBar(x.progress, x.target)}\n     ${x.progress} / ${x.target}`;
            }).join('\n\n');
            blocks.push({ emoji: '🔥', title: `مهام نشطة (${list.active.length})`, content });
        }

        if (list.completed.length) {
            const content = list.completed.slice(0, 5).map(x => {
                const d = DIFF[x.mission.difficulty];
                return `✅ ${d.emoji} *${x.mission.name}*`;
            }).join('\n');
            blocks.push({ emoji: '🎁', title: `مهام مكتملة (${list.completed.length})`, content: content + `\n\n💡 استلم المكافآت بـ .مكافأة` });
        }

        // أول مهمة متاحة
        const suggested = m.getNextSuggested(ctx.sender);
        if (suggested && suggested.mission) {
            const mm = suggested.mission;
            const d = DIFF[mm.difficulty];
            blocks.push({
                emoji: '📌', title: 'المهمة الحالية',
                content: `${d.emoji} *${mm.name}*\n${progressBar(suggested.row ? suggested.row.progress : 0, mm.target)}\n\nاكتب .مهمة لعرض التفاصيل`,
            });
        }

        if (!blocks.length) blocks.push({ emoji: '📌', title: 'ابدأ الآن', content: '.مهمة — لبدء أول مهمة' });

        await ctx.card('🎯 المهام', blocks);
    }
};
