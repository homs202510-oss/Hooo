const report = require('./svc-report');
const user = require('./mod-user');

module.exports = {
    name: 'تقرير',
    aliases: ['report'],
    desc: 'تقرير شامل عن حالتك',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const r = report.buildReport(ctx.sender);
        const next = report.getNextSuggestion(r);
        const missing = report.getMissing(r);

        const blocks = [];

        // ═══ الحالة الأساسية ═══
        blocks.push({
            emoji: '👤', title: 'حالتك',
            content: `الرتبة: ${r.rank.name}\nالمستوى: ${r.user.level}\n💰 ${r.user.coins.toLocaleString('ar-EG')}\n⭐ سمعة: ${r.repInfo.score}`
        });

        // ═══ المملكة ═══
        if (r.kingdom) {
            blocks.push({
                emoji: '🏰', title: r.kingdom.name,
                content: `📈 Lv${r.kingdom.level} • قوة ${r.kingdom.power.toLocaleString('ar-EG')}\n🏗️ ${r.buildings} مبنى\n⚔️ ${r.army} جندي (${r.attack}/${r.defense})\n🤝 تحالفات: ${r.alliances} • ⚔️ حروب: ${r.wars}`
            });
        } else {
            blocks.push({ emoji: '🏰', title: 'المملكة', content: 'لسه معندكش مملكة' });
        }

        // ═══ التقدم ═══
        blocks.push({
            emoji: '🎯', title: 'التقدم',
            content: `🎯 مهام: ${r.missions}\n🏆 إنجازات: ${r.achCount}\n📋 أهداف: ${r.goalsActive}\n🔔 تنبيهات: ${r.unreadNotif}\n🏗️ مشاريع: ${r.projectsActive}`
        });

        // ═══ نواقص ═══
        if (missing.length) {
            blocks.push({ emoji: '⚠️', title: 'أهم النواقص', content: missing.join('\n') });
        }

        // ═══ الخطوة التالية ═══
        blocks.push({ emoji: next.emoji, title: 'الخطوة المقترحة', content: `${next.text}\n⌨️ ${next.cmd}` });

        await ctx.card('📊 التقرير', blocks);
    }
};
