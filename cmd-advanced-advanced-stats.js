/**
 * 📊 .إحصائيات — إحصائيات متقدمة
 */
const db = require('./core-database');
const user = require('./mod-user');
const kd = require('./mod-kingdom');
const mil = require('./mod-military');
const ach = require('./mod-achievements');
const rep = require('./mod-reputation');

module.exports = {
    name: 'إحصائيات_متقدمة',
    aliases: ['stats-adv', 'إحصائيات_متقدمة'],
    desc: 'إحصائيات متقدمة',
    async run(ctx) {
        let targetJid = ctx.sender;
        let isSelf = true;

        if (ctx.mentioned.length > 0) { targetJid = ctx.mentioned[0]; isSelf = false; }
        else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;
            isSelf = false;
        }

        const u = user.getOrCreate(targetJid);
        const k = kd.getKingdom(targetJid);
        const repInfo = rep.getTierInfo(targetJid);

        // إحصائيات ECONOMY
        const buys = db.prepare("SELECT COUNT(*) as c, COALESCE(SUM(total), 0) as t FROM market_log WHERE user_jid = ? AND action = 'buy'").get(targetJid);
        const sells = db.prepare("SELECT COUNT(*) as c, COALESCE(SUM(total), 0) as t FROM market_log WHERE user_jid = ? AND action = 'sell'").get(targetJid);
        const auctions = db.prepare("SELECT COUNT(*) as c FROM auctions WHERE seller_jid = ?").get(targetJid).c;
        const bids = db.prepare("SELECT COUNT(*) as c FROM auction_bids WHERE bidder_jid = ?").get(targetJid).c;
        const histCount = db.prepare('SELECT COUNT(*) as c FROM player_history WHERE user_jid = ?').get(targetJid).c;

        // PROGRESS
        const missions = db.prepare("SELECT COUNT(*) as c FROM mission_progress WHERE user_jid = ? AND status IN ('completed','claimed')").get(targetJid).c;
        const achCount = ach.getUnlockedCount(targetJid);

        const blocks = [
            {
                emoji: '💰', title: 'الاقتصاد',
                content: `💵 الرصيد: ${u.coins.toLocaleString('ar-EG')}
🛒 شراء: ${buys.c} (${buys.t.toLocaleString('ar-EG')})
💸 بيع: ${sells.c} (${sells.t.toLocaleString('ar-EG')})
🏷️ مزادات: ${auctions} • مزايدات: ${bids}
📜 عمليات: ${histCount}`,
            },
        ];

        if (k) {
            const armyStats = mil.getArmyStats(k.id);
            const armyCount = mil.getArmyCount(k.id);
            const buildings = kd.getBuildings(k.id);
            const bCount = buildings.reduce((s, b) => s + b.count, 0);

            blocks.push({
                emoji: '🏰', title: 'المملكة',
                content: `👑 ${k.name}\n📈 Lv${k.level} • قوة ${k.power.toLocaleString('ar-EG')}\n🏗️ ${bCount} مبنى\n⚔️ ${armyCount} جندي (${armyStats.attack}/${armyStats.defense})`,
            });
        }

        blocks.push({
            emoji: '📈', title: 'التقدم',
            content: `⭐ XP: ${u.xp.toLocaleString('ar-EG')} • Lv${u.level}
🎯 مهام: ${missions}
🏆 إنجازات: ${achCount}
⭐ سمعة: ${repInfo.score} (${repInfo.tier.name})`,
        });

        await ctx.card('📊 إحصائيات متقدمة', blocks, isSelf ? [] : [targetJid]);
    }
};
