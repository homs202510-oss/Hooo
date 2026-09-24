/**
 * ⚔️ .حرب — إعلان حرب + معركة فورية
 */
const kd = require('./mod-kingdom');
const mil = require('./mod-military');
const dp = require('./mod-diplomacy');
const user = require('./mod-user');
const logs = require('./mod-group-logs');
const tracker = require('./mod-tracker');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'حرب',
    aliases: ['war'],
    desc: 'إعلان حرب + معركة فورية',
    groupOnly: true,
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const myK = kd.getKingdom(ctx.sender);
        if (!myK) return ctx.error('محتاج تنشئ مملكة الأول');

        const armyCount = mil.getArmyCount(myK.id);
        if (armyCount === 0) return ctx.error('جيشك فاضي!\n\n.تجنيد الأول');

        let targetJid = null;
        if (ctx.mentioned.length > 0) targetJid = ctx.mentioned[0];
        else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant)
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;

        if (!targetJid) {
            return ctx.card('⚔️ الحرب', [
                { emoji: '🎯', title: 'الطريقة', content: '.حرب @شخص' },
                { emoji: '💡', title: 'ملاحظة', content: 'المعركة هتحصل فوراً' },
            ]);
        }

        const targetNumber = extractNumber(targetJid);
        if (targetNumber === ctx.senderNumber) return ctx.error('مش ممكن تحارب نفسك');

        user.getOrCreate(targetJid);
        const otherK = kd.getKingdom(targetJid);
        if (!otherK) return ctx.error('الطرف الآخر معندوش مملكة');

        // فحص التحالف
        const alliance = dp.getAllianceBetween(myK.id, otherK.id);
        if (alliance && alliance.status === 'active') {
            return ctx.error('ما تقدرش تحارب حليف! 🤝');
        }

        // ═══ إعلان الحرب في DB ═══
        const createResult = dp.createWar(myK.id, otherK.id);

        // لو فيه حرب نشطة بالفعل
        if (!createResult.ok && createResult.reason === 'already_active') {
            // نكمل المعركة عادي
        } else if (!createResult.ok && createResult.reason !== 'already_active') {
            return ctx.error('فشل إعلان الحرب');
        }

        // ═══ المعركة الفورية ═══
        const battle = mil.attack(myK.id, otherK.id);

        if (!battle.ok) {
            if (battle.reason === 'no_army_attacker') return ctx.error('جيشك فاضي');
            return ctx.error('فشل الهجوم');
        }

        // ═══ تسجيل الأحداث ═══
        tracker.track(ctx.sender, 'attack_count', 1);
        if (battle.winner === 'attacker') tracker.track(ctx.sender, 'wins_count', 1);

        try { logs.log(ctx.jid, 'war_battle', ctx.sender, targetJid, `winner=${battle.winner}`); } catch (_) {}

        // ═══ إنهاء الحرب فوراً بناءً على النتيجة ═══
        const warRow = dp.getWarBetween(myK.id, otherK.id);
        if (warRow && warRow.status === 'active') {
            if (battle.winner === 'attacker') {
                dp.winWar(warRow.id, myK.id);
            } else {
                dp.winWar(warRow.id, otherK.id);
            }
        }

        // ═══ إشعار الفايز ═══
        const events = require('./mod-events');
        try { events.emit(battle.winner === 'attacker' ? 'battle_won' : 'battle_lost', { user_jid: ctx.sender }); } catch (_) {}
        try { events.emit(battle.winner === 'defender' ? 'battle_won' : 'battle_lost', { user_jid: targetJid }); } catch (_) {}

        // ═══ عرض النتيجة ═══
        const winnerText = battle.winner === 'attacker' ? '🎉 *انتصار!*' : '💔 *هزيمة!*';
        const winnerName = battle.winner === 'attacker' ? myK.name : otherK.name;

        let lootContent = 'مفيش غنائم';
        if (battle.loot && Object.keys(battle.loot).length) {
            lootContent = Object.entries(battle.loot).map(([r, a]) => {
                const info = kd.RESOURCE_LABELS[r];
                return `${info.emoji} ${info.name}: +${a}`;
            }).join('\n');
        }

        await ctx.card('⚔️ نتيجة المعركة', [
            { emoji: battle.winner === 'attacker' ? '🏆' : '🛡️', title: 'النتيجة', content: `${winnerText}\nالفايز: *${winnerName}*` },
            { emoji: '📊', title: 'القوى', content: `👤 ${myK.name}: ${battle.aPower.toLocaleString('ar-EG')}\n🛡️ ${otherK.name}: ${battle.dPower.toLocaleString('ar-EG')}` },
            { emoji: '💀', title: 'الخسائر', content: `👤 ${myK.name}: ${battle.losses.attacker} جندي\n🛡️ ${otherK.name}: ${battle.losses.defender} جندي` },
            ...(battle.winner === 'attacker' && battle.loot && Object.keys(battle.loot).length
                ? [{ emoji: '💰', title: 'الغنائم', content: lootContent }]
                : []),
            { emoji: '⚔️', title: 'الحالة', content: 'الحرب انتهت' },
        ], [targetJid]);
    }
};
