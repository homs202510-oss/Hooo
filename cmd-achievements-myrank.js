const ranks = require('./mod-ranks');
const ach = require('./mod-achievements');
const titles = require('./mod-titles');
const user = require('./mod-user');
const mil = require('./mod-military');
const kd = require('./mod-kingdom');

function bar(p, t) {
    const percent = Math.min(100, Math.floor((p / t) * 100));
    const filled = Math.floor(percent / 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled) + ' ' + percent + '%';
}

module.exports = {
    name: 'رتبتي',
    aliases: ['myrank', 'rank'],
    desc: 'عرض رتبتك الكاملة',
    async run(ctx) {
        const u = user.getOrCreate(ctx.sender, ctx.pushName);
        const rank = ranks.getUserRank(ctx.sender);
        const achCount = ach.getUnlockedCount(ctx.sender);
        const state = ach.getLiveState(ctx.sender);
        const activeTitle = titles.getActiveTitle(ctx.sender);
        const titleCount = titles.getTitles(ctx.sender).length;

        const k = kd.getKingdom(ctx.sender);
        const armyStats = k ? mil.getArmyStats(k.id) : { attack: 0, defense: 0 };

        const progress = ranks.canPromote(ctx.sender);
        let progressText = 'وصلت لأعلى رتبة 💎';
        if (progress.next) {
            const met = progress.checks.filter(c => c.met).length;
            const total = progress.checks.length;
            progressText = `${bar(met, total)}\n${met}/${total} شرط مكتمل\n\nالرتبة التالية: *${progress.next.name}*`;
        }

        const blocks = [
            {
                emoji: rank.color || '👤', title: `رتبتك: ${rank.name}`,
                content: `💎 الرتبة: ${rank.id}/8${activeTitle ? `\n🏷️ اللقب: ${activeTitle}` : ''}`
            },
            {
                emoji: '📊', title: 'التقدم',
                content: `⭐ XP: ${u.xp.toLocaleString('ar-EG')}\n📈 Level: ${u.level}\n🏆 إنجازات: ${achCount}\n🏷️ ألقاب: ${titleCount}`
            },
            {
                emoji: '🏰', title: 'المملكة',
                content: k
                    ? `📈 مستوى: ${k.level}\n⚔️ قوة: ${k.power.toLocaleString('ar-EG')}\n🛡️ دفاع: ${armyStats.defense.toLocaleString('ar-EG')}`
                    : 'لسه معندكش مملكة'
            },
            { emoji: '⬆️', title: 'نحو الترقية', content: progressText },
        ];

        await ctx.card('👑 رتبتك', blocks);
    }
};
