/**
 * 🧪 .فحص — للمطور — يفحص البوت أدمن فعلاً؟
 */
const perm = require('./mod-group-permissions');
const dev = require('./mod-developer');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'فحص',
    aliases: ['check'],
    desc: 'فحص حالة البوت في الجروب',
    groupOnly: true,
    hidden: true,
    async run(ctx) {
        if (!dev.isPrivileged(ctx.sender) && !require('./mod-user').isOwner(ctx.sender)) {
            return ctx.error('للمطور بس');
        }

        const botId = ctx.sock.user?.id || '';
        const botLid = ctx.sock.user?.lid || '';
        const botNum = extractNumber(botId);

        // فحص قديم
        const oldCheck = perm.isBotAdmin(ctx.groupMetadata, botId);

        // فحص حديث
        const freshCheck = await perm.checkBotAdminFresh(ctx.sock, ctx.jid);

        // جيب الـ metadata الحديثة
        let freshMeta = null;
        try {
            freshMeta = await ctx.sock.groupMetadata(ctx.jid);
        } catch (_) {}

        // ابحث عن البوت
        let botParticipant = null;
        if (freshMeta) {
            const botNums = [botNum, extractNumber(botLid)].filter(Boolean);
            for (const p of freshMeta.participants) {
                const candidates = [p.id, p.jid, p.phoneNumber, p.lid, p.pn].filter(Boolean);
                for (const c of candidates) {
                    if (botNums.includes(extractNumber(c))) {
                        botParticipant = p;
                        break;
                    }
                }
                if (botParticipant) break;
            }
        }

        const blocks = [
            { emoji: '🤖', title: 'Bot JID', content: botId || 'مفيش' },
            { emoji: '📱', title: 'Bot LID', content: botLid || 'مفيش' },
            { emoji: '🔢', title: 'Bot Number', content: botNum || 'مفيش' },
            { emoji: '👥', title: 'الأعضاء', content: `${freshMeta?.participants?.length || 0} عضو` },
            { emoji: oldCheck ? '✅' : '❌', title: 'فحص قديم', content: oldCheck ? 'أدمن ✅' : 'مش أدمن ❌' },
            { emoji: freshCheck ? '✅' : '❌', title: 'فحص حديث', content: freshCheck ? 'أدمن ✅' : 'مش أدمن ❌' },
        ];

        if (botParticipant) {
            blocks.push({
                emoji: '🔍',
                title: 'بيانات البوت من الجروب',
                content: `ID: ${botParticipant.id || '—'}\nJID: ${botParticipant.jid || '—'}\nLID: ${botParticipant.lid || '—'}\nAdmin: ${botParticipant.admin || 'member'}`,
            });
        } else {
            blocks.push({
                emoji: '❌',
                title: 'البوت مش في الأعضاء',
                content: 'البوت مش موجود في participants',
            });
        }

        await ctx.card('🧪 فحص الجروب', blocks);
    }
};
