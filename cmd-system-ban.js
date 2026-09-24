/**
 * 🚫 .حظر [رقم/mention/reply] [سبب] — حظر استعمال البوت
 */
const blocks = require('./mod-blocks');
const moderation = require('./mod-aiModeration');
const waBlock = require('./mod-whatsappBlock');
const user = require('./mod-user');
const dev = require('./mod-developer');

module.exports = {
    name: 'حظر',
    aliases: ['ban'],
    desc: 'حظر مستخدم من البوت',
    async run(ctx) {
        if (!user.isOwner(ctx.sender) && !dev.isDeveloper(ctx.sender)) {
            return ctx.error('الأمر ده للمطور بس 👑');
        }

        // ═══ استخرج الهدف ═══
        let targetJid = null;
        let targetNum = null;
        let reason = 'حظر يدوي من المطور';

        // 1) mention
        if (ctx.mentioned.length > 0) {
            targetJid = ctx.mentioned[0];
            targetNum = targetJid.split('@')[0].split(':')[0];
            reason = ctx.args.join(' ').trim() || reason;
        }
        // 2) reply
        else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;
            targetNum = targetJid.split('@')[0].split(':')[0];
            reason = ctx.args.join(' ').trim() || reason;
        }
        // 3) رقم مباشر
        else if (ctx.args[0] && /^[0-9+\s-]+$/.test(ctx.args[0])) {
            targetNum = ctx.args[0].replace(/\D/g, '');
            targetJid = targetNum + '@s.whatsapp.net';
            reason = ctx.args.slice(1).join(' ').trim() || reason;
        }

        if (!targetJid || !targetNum || targetNum.length < 8) {
            return ctx.card('🚫 حظر مستخدم', [
                { emoji: '📌', title: 'الاستخدام', content: '.حظر @شخص [سبب]\n.حظر [رقم] [سبب]\nأو Reply على رسالة الشخص' },
                { emoji: '💡', title: 'أمثلة', content: '.حظر @شخص شتيمة\n.حظر <الرقم> سبام' },
            ]);
        }

        // ممنوع تحظر نفسك
        if (targetNum === ctx.senderNumber) {
            return ctx.error('مش ممكن تحظر نفسك 😅');
        }

        // ممنوع تحظر المطور
        const devJid = dev.getDeveloperJid();
        if (devJid && targetJid === devJid) {
            return ctx.error('مش ممكن تحظر المطور 👑');
        }

        // ═══ نفذ الحظر ═══
        blocks.block(targetJid, reason, 'manual');
        moderation.logBlock(targetJid, reason, 0);

        // حظر واتساب حقيقي
        let waOk = false;
        try {
            const r = await waBlock.blockOnWhatsApp(ctx.sock, targetJid);
            waOk = r.ok;
        } catch (_) {}

        // إشعار الشخص (لو واتساب سمح)
        try {
            await ctx.sock.sendMessage(targetJid, {
                text: `🚫 *تم حظرك من البوت*\n\n📌 السبب: ${reason}\n\n💡 لو ندمان، اتكلم مع المطور +${require('./config').ownerNumber}`,
            });
        } catch (_) {}

        // إشعار للمطور
        await ctx.card('🚫 تم الحظر', [
            { emoji: '📱', title: 'الرقم', content: `+${targetNum}` },
            { emoji: '📌', title: 'السبب', content: reason },
            { emoji: waOk ? '✅' : '⚠️', title: 'واتساب', content: waOk ? 'حظر حقيقي ✅' : 'فشل (DB بس)' },
            { emoji: '💡', title: 'فك الحظر', content: `.فك ${targetNum}` },
        ], [targetJid]);

        console.log(`🚫 BAN: +${targetNum} — ${reason} — WA:${waOk}`);
    }
};
