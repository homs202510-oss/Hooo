const kd = require('./mod-kingdom');
const user = require('./mod-user');

module.exports = {
    name: 'مملكة',
    aliases: ['kingdom', 'مملكتي'],
    desc: 'عرض معلومات مملكتك',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const k = kd.getKingdom(ctx.sender);
        if (!k) {
            return ctx.card('المملكة', [
                { emoji: '🏰', title: 'مفيش مملكة', content: 'لسه معندكش مملكة' },
                { emoji: '💡', title: 'ابدأ الآن', content: '.إنشاء [اسم المملكة]' },
            ]);
        }

        const res = kd.getResources(k.id);
        const buildings = kd.getBuildings(k.id);
        const army = kd.getArmy(k.id);
        const stats = kd.getArmyStats(k.id);
        const rate = kd.getProductionPerHour(k.id);
        const bonuses = kd.getKingdomBonuses(k.id);

        const infoContent = `📛 الاسم    : ${k.name}\n📈 المستوى  : ${k.level}\n⚔️ القوة    : ${k.power.toLocaleString('ar-EG')}`;
        const resContent = Object.entries(kd.RESOURCE_LABELS).map(([type, info]) => {
            const amount = res[type] || 0;
            return `${info.emoji} ${info.name.padEnd(6)} : ${amount.toLocaleString('ar-EG')}`;
        }).join('\n');
        const prodContent = Object.entries(rate).filter(([_, v]) => v > 0)
            .map(([type, amount]) => {
                const info = kd.getResourceInfo(type);
                return `${info.emoji} ${info.name.padEnd(6)} : +${amount.toLocaleString('ar-EG')}/س`;
            }).join('\n') || 'مفيش إنتاج';

        const armyContent = army.length
            ? army.map(a => {
                const info = kd.getArmyInfo(a.soldier_type);  // ✅ helper آمن
                return `${info.emoji} ${a.soldier_type} : ${a.count}`;
            }).join('\n') + `\n\n⚔️ هجوم: ${stats.attack.toLocaleString('ar-EG')}\n🛡️ دفاع: ${stats.defense.toLocaleString('ar-EG')}`
            : 'مفيش جيش';

        const bCount = buildings.reduce((s, b) => s + b.count, 0);

        const buildingsContent = buildings.length
            ? buildings.map(b => {
                const info = kd.getBuildingInfo(b.building_type);  // ✅ helper آمن
                return `${info.emoji} ${b.building_type} × ${b.count}`;
            }).join('\n')
            : 'مفيش مباني';

        await ctx.card('مملكتك', [
            { emoji: '🏰', title: 'المعلومات', content: infoContent },
            { emoji: '📦', title: 'الموارد', content: resContent },
            { emoji: '⚙️', title: 'الإنتاج/ساعة', content: prodContent },
            { emoji: '⚔️', title: `الجيش (${kd.getArmyCount(k.id)}/${kd.getMaxArmy(k.id)})`, content: armyContent },
            { emoji: '🏗️', title: `المباني (${bCount})`, content: buildingsContent },
        ]);
    }
};
