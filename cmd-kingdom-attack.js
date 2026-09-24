const kd = require('./mod-kingdom');
const mil = require('./mod-military');
const dp = require('./mod-diplomacy');
const user = require('./mod-user');
const tracker = require('./mod-tracker');

module.exports = {
    name: 'هجوم',
    aliases: ['attack'],
    desc: 'هجوم على مملكة',
    groupOnly: true,
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const myK = kd.getKingdom(ctx.sender);
        if (!myK) return ctx.error('محتاج تنشئ مملكة الأول');

        const armyCount = mil.getArmyCount(myK.id);
        if (armyCount === 0) return ctx.error('جيشك فاضي!\n\nاستخدم .تجنيد الأول');

        let targetJid = null;
        if (ctx.mentioned.length > 0) targetJid = ctx.mentioned[0];
        else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;
        }

        if (!targetJid) {
            return ctx.card('⚔️ الهجوم', [
                { emoji: '🎯', title: 'الطريقة', content: '.هجوم @شخص\nأو الرد على رسالة' },
                { emoji: '⚠️', title: 'تحذير', content: 'الهجوم بيأثر على الطرفين' },
            ]);
        }

        const targetNumber = targetJid.split('@')[0].split(':')[0];
        if (targetNumber === ctx.senderNumber) return ctx.error('مش ممكن تهجم على نفسك');

        user.getOrCreate(targetJid);
        const otherK = kd.getKingdom(targetJid);
        if (!otherK) return ctx.error('الطرف الآخر معندوش مملكة');

        const alliance = dp.getAllianceBetween(myK.id, otherK.id);
        if (alliance && alliance.status === 'active') {
            return ctx.error('ما تقدرش تهجم على حليف!');
        }

        const result = mil.attack(myK.id, otherK.id);
        if (!result.ok) {
            if (result.reason === 'no_army_attacker') return ctx.error('جيشك فاضي');
            return ctx.error('فشل الهجوم');
        }

        // ✅ Tracking
        tracker.track(ctx.sender, 'attack_count', 1);
        if (result.winner === 'attacker') tracker.track(ctx.sender, 'wins_count', 1);

        const winnerText = result.winner === 'attacker' ? '🎉 *انتصار!*' : '💔 *هزيمة!*';
        const winnerName = result.winner === 'attacker' ? myK.name : otherK.name;

        let lootContent = 'مفيش غنائم';
        if (result.loot && Object.keys(result.loot).length) {
            lootContent = Object.entries(result.loot).map(([r, a]) => {
                const info = kd.RESOURCE_LABELS[r];
                return `${info.emoji} ${info.name}: +${a}`;
            }).join('\n');
        }

        await ctx.card('⚔️ نتيجة المعركة', [
            { emoji: result.winner === 'attacker' ? '🏆' : '🛡️', title: 'النتيجة', content: `${winnerText}\nالفائز: *${winnerName}*` },
            { emoji: '📊', title: 'القوى', content: `👤 ${myK.name}: ${result.aPower.toLocaleString('ar-EG')}\n🛡️ ${otherK.name}: ${result.dPower.toLocaleString('ar-EG')}` },
            { emoji: '💀', title: 'الخسائر', content: `👤 ${myK.name}: ${result.losses.attacker} جندي\n🛡️ ${otherK.name}: ${result.losses.defender} جندي` },
            ...(result.winner === 'attacker' && result.loot && Object.keys(result.loot).length
                ? [{ emoji: '💰', title: 'الغنائم', content: lootContent }]
                : []),
        ], [targetJid]);
    }
};
