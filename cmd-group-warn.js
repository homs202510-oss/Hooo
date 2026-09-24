/**
 * ⚠️ .تحذير @user [سبب]
 */
const warn = require('./mod-group-warnings');
const perm = require('./mod-group-permissions');
const logs = require('./mod-group-logs');
const user = require('./mod-user');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'تحذير',
    aliases: ['warn'],
    desc: 'تحذير عضو',
    groupOnly: true,
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const permLevel = perm.level(ctx.sender, ctx.groupMetadata, ctx.sock.user?.id);
        if (permLevel === 'member') return ctx.error('الأمر ده للأدمن بس');

        let targetJid = null, reason = '';
        if (ctx.mentioned.length > 0) {
            targetJid = ctx.mentioned[0];
            reason = ctx.args.slice(ctx.args.indexOf(ctx.args.find(a => a.includes('@'))) + 1).join(' ').trim() || 'بدون سبب';
        } else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;
            reason = ctx.args.join(' ').trim() || 'بدون سبب';
        }

        if (!targetJid) return ctx.error('اعمل mention أو Reply للشخص');

        const targetNum = extractNumber(targetJid);
        if (!perm.canModerate(ctx.sender, targetJid, ctx.groupMetadata, ctx.sock.user?.id)) {
            return ctx.error('مش ممكن تحذر الشخص ده');
        }

        const count = warn.add(ctx.jid, targetJid, reason, ctx.sender);
        logs.log(ctx.jid, 'warning', ctx.sender, targetJid, reason);

        // لو وصل الحد
        if (count >= warn.MAX_WARNINGS) {
            const isBotAdmin = perm.isBotAdmin(ctx.groupMetadata, ctx.sock.user?.id);
            if (isBotAdmin) {
                try {
                    await ctx.sock.groupParticipantsUpdate(ctx.jid, [targetJid], 'remove');
                    warn.clear(ctx.jid, targetJid);
                    logs.log(ctx.jid, 'kick', ctx.sock.user?.id, targetJid, 'وصل 3 تحذيرات');
                    return ctx.sock.sendMessage(ctx.jid, {
                        text: `🚫 *تم طرد @${targetNum}*\n\nوصل للحد الأقصى (3 تحذيرات).`,
                        mentions: [targetJid],
                    });
                } catch (e) {
                    return ctx.error('البوت مش قادر يطرد — تأكد إنه أدمن');
                }
            } else {
                return ctx.sock.sendMessage(ctx.jid, {
                    text: `⚠️ @${targetNum} وصل 3 تحذيرات\n\n❌ البوت مش أدمن — مش قادر يطرد`,
                    mentions: [targetJid],
                });
            }
        }

        await ctx.sock.sendMessage(ctx.jid, {
            text: `⚠️ *تحذير*\n\n@${targetNum}\n\n📌 السبب: ${reason}\n📊 التحذيرات: *${count}/${warn.MAX_WARNINGS}*`,
            mentions: [targetJid],
        });
    }
};
