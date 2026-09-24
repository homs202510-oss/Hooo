const kd = require('./mod-kingdom');
const dp = require('./mod-diplomacy');
const user = require('./mod-user');

module.exports = {
    name: 'حالة',
    aliases: ['status', 'حالتي'],
    desc: 'حالة المملكة والعلاقات',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const myK = kd.getKingdom(ctx.sender);

        if (!myK) {
            return ctx.error('محتاج تنشئ مملكة الأول\n.إنشاء [اسم المملكة]');
        }

        const res = kd.getResources(myK.id);
        const buildings = kd.getBuildings(myK.id);
        const bCount = buildings.reduce((s, b) => s + b.count, 0);

        const alliances = dp.getAlliances(myK.id);
        const activeAlliances = alliances.filter(a => a.status === 'active');
        const pendingAlliances = alliances.filter(a => a.status === 'pending');

        const challenges = dp.getChallenges(myK.id);
        const activeChallenges = challenges.filter(c => c.status === 'accepted');
        const pendingChallenges = challenges.filter(c => c.status === 'pending');

        const wars = dp.getWars(myK.id);

        const resStr = Object.entries(kd.RESOURCE_LABELS)
            .map(([type, info]) => `${info.emoji} ${info.name}: ${res[type] || 0}`)
            .join('  •  ');

        const allianceStr = activeAlliances.length
            ? activeAlliances.map(a => `🤝 ${dp.getKingdomName(a.partner_id)}`).join('\n')
            : 'مفيش';

        const pendingAllianceStr = pendingAlliances.length
            ? pendingAlliances.map(a => `⏳ ${dp.getKingdomName(a.partner_id)}`).join('\n')
            : 'مفيش';

        const challengeStr = activeChallenges.length
            ? activeChallenges.map(c => `⚔️ ${dp.getKingdomName(c.opponent_id)}`).join('\n')
            : 'مفيش';

        const pendingChallengeStr = pendingChallenges.length
            ? pendingChallenges.map(c => `⏳ ${dp.getKingdomName(c.opponent_id)}`).join('\n')
            : 'مفيش';

        const warStr = wars.length
            ? wars.map(w => `🔥 ${dp.getKingdomName(w.opponent_id)}`).join('\n')
            : 'مفيش';

        await ctx.card('حالة المملكة', [
            { emoji: '🏰', title: myK.name, content: `المستوى ${myK.level}  •  القوة ${myK.power}  •  المباني ${bCount}` },
            { emoji: '📦', title: 'الموارد', content: resStr },
            { emoji: '🤝', title: `التحالفات النشطة (${activeAlliances.length})`, content: allianceStr },
            { emoji: '📩', title: `طلبات تحالف معلقة (${pendingAlliances.length})`, content: pendingAllianceStr },
            { emoji: '⚔️', title: `التحديات النشطة (${activeChallenges.length})`, content: challengeStr },
            { emoji: '⏳', title: `تحديات معلقة (${pendingChallenges.length})`, content: pendingChallengeStr },
            { emoji: '🔥', title: `الحروب النشطة (${wars.length})`, content: warStr },
        ]);
    }
};
