const user = require('./mod-user');
const ranks = require('./mod-ranks');
const ach = require('./mod-achievements');
const titles = require('./mod-titles');
const rep = require('./mod-reputation');
const tracker = require('./mod-tracker');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'معلومات_عضو',
    aliases: ['memberinfo'],
    desc: 'معلومات عضو',
    async run(ctx) {
        let targetJid = null;
        if (ctx.mentioned.length > 0) targetJid = ctx.mentioned[0];
        else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant)
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;
        else targetJid = ctx.sender;

        const u = user.getOrCreate(targetJid);
        const rank = ranks.getUserRank(targetJid);
        const title = titles.getActiveTitle(targetJid);
        const achCount = ach.getUnlockedCount(targetJid);
        const repInfo = rep.getTierInfo(targetJid);
        const stats = tracker.getStats(targetJid) || {};
        const num = extractNumber(targetJid);

        const joinDate = u.created_at ? new Date(u.created_at * 1000).toLocaleDateString('ar-EG') : 'مش معروف';

        await ctx.card(`👤 معلومات @${num}`, [
            { emoji: '📛', title: 'الاسم', content: u.name || u.push_name || 'مجهول' },
            { emoji: '👑', title: 'الرتبة', content: rank.name },
            ...(title ? [{ emoji: '🏷️', title: 'اللقب', content: title }] : []),
            { emoji: '⭐', title: 'المستوى', content: `${u.level} (XP: ${u.xp.toLocaleString('ar-EG')})` },
            { emoji: '💰', title: 'النقاط', content: `${u.coins.toLocaleString('ar-EG')}` },
            { emoji: '⭐', title: 'السمعة', content: `${repInfo.score} (${repInfo.tier.name})` },
            { emoji: '🏆', title: 'الإنجازات', content: `${achCount}` },
            { emoji: '📅', title: 'الانضمام', content: joinDate },
        ], [targetJid]);
    }
};
