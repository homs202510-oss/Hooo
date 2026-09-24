const ach = require('./mod-achievements');
const { ACH_CATS } = require('./data-achievements');
const user = require('./mod-user');

function bar(p, t) {
    const percent = Math.min(100, Math.floor((p / t) * 100));
    const filled = Math.floor(percent / 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled) + ' ' + percent + '%';
}

module.exports = {
    name: 'إنجازات',
    aliases: ['achievements'],
    desc: 'عرض الإنجازات',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const list = ach.getList(ctx.sender);

        const blocks = [];

        if (list.unlocked.length) {
            const content = list.unlocked.slice(0, 5).map(x => {
                const cat = ACH_CATS[x.achievement.cat];
                return `${cat.emoji} *${x.achievement.name}*${x.claimed ? ' ✅' : ' 🎁'}`;
            }).join('\n');
            blocks.push({ emoji: '🏆', title: `مفتوحة (${list.unlocked.length})`, content });
        }

        if (list.inProgress.length) {
            const content = list.inProgress.slice(0, 5).map(x => {
                const cat = ACH_CATS[x.achievement.cat];
                return `${cat.emoji} *${x.achievement.name}*\n     ${bar(x.progress, x.achievement.target)}`;
            }).join('\n\n');
            blocks.push({ emoji: '📊', title: `قيد التقدم (${list.inProgress.length})`, content });
        }

        if (!blocks.length) {
            blocks.push({ emoji: '📌', title: 'ابدأ الآن', content: 'لسه معندكش إنجازات' });
        }

        blocks.push({
            emoji: '💡', title: 'ملاحظات',
            content: '.جوائز — لاستلام المكافآت\n.لقب — لعرض الألقاب',
        });

        await ctx.card('🏆 الإنجازات', blocks);
    }
};
