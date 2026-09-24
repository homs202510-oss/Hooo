const kd = require('./mod-kingdom');
const mil = require('./mod-military');
const user = require('./mod-user');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'مقارنة',
    aliases: ['compare'],
    desc: 'مقارنة مع لاعب',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const myK = kd.getKingdom(ctx.sender);
        if (!myK) return ctx.error('محتاج تنشئ مملكة الأول');

        let targetJid = null;
        if (ctx.mentioned.length > 0) targetJid = ctx.mentioned[0];
        else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant)
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;

        if (!targetJid) {
            return ctx.card('⚖️ المقارنة', [
                { emoji: '📌', title: 'الاستخدام', content: '.مقارنة @شخص\nأو Reply على رسالته' },
            ]);
        }

        if (targetJid === ctx.sender) return ctx.error('مش ممكن تقارن نفسك');

        user.getOrCreate(targetJid);
        const otherK = kd.getKingdom(targetJid);
        if (!otherK) return ctx.error('الطرف التاني معندوش مملكة');

        const myArmy = mil.getArmyCount(myK.id);
        const myStats = mil.getArmyStats(myK.id);
        const otherArmy = mil.getArmyCount(otherK.id);
        const otherStats = mil.getArmyStats(otherK.id);

        const myRes = kd.getResources(myK.id);
        const otherRes = kd.getResources(otherK.id);

        const myTotal = Object.values(myRes).reduce((s, v) => s + v, 0);
        const otherTotal = Object.values(otherRes).reduce((s, v) => s + v, 0);

        const myBuildings = kd.getBuildings(myK.id).reduce((s, b) => s + b.count, 0);
        const otherBuildings = kd.getBuildings(otherK.id).reduce((s, b) => s + b.count, 0);

        const num = extractNumber(targetJid);

        const format = (label, a, b) => {
            const winner = a > b ? '👈' : a < b ? '👉' : '⚖️';
            return `${label}\n   ${myK.name}: ${a.toLocaleString('ar-EG')} ${winner}\n   ${otherK.name}: ${b.toLocaleString('ar-EG')}`;
        };

        await ctx.card(`⚖️ ${myK.name} vs ${otherK.name}`, [
            { emoji: '📈', title: 'المستوى', content: format('مستوى', myK.level, otherK.level) },
            { emoji: '⚔️', title: 'القوة', content: format('قوة', myK.power, otherK.power) },
            { emoji: '🪖', title: 'الجيش', content: format('جنود', myArmy, otherArmy) },
            { emoji: '🗡️', title: 'الهجوم', content: format('هجوم', myStats.attack, otherStats.attack) },
            { emoji: '🛡️', title: 'الدفاع', content: format('دفاع', myStats.defense, otherStats.defense) },
            { emoji: '🏗️', title: 'المباني', content: format('مباني', myBuildings, otherBuildings) },
            { emoji: '📦', title: 'الموارد', content: format('إجمالي', myTotal, otherTotal) },
        ], [targetJid]);
    }
};
