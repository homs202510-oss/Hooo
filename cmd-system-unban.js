/**
 * 🔓 .فك [رقم/mention/reply] — فك الحظر
 */
const blocks = require('./mod-blocks');
const moderation = require('./mod-aiModeration');
const waBlock = require('./mod-whatsappBlock');
const user = require('./mod-user');
const dev = require('./mod-developer');
const db = require('./core-database');

module.exports = {
    name: 'فك',
    aliases: ['unban', 'فك_الحظر', 'رفع_الحظر'],
    desc: 'فك الحظر عن مستخدم',
    async run(ctx) {
        if (!user.isOwner(ctx.sender) && !dev.isDeveloper(ctx.sender)) {
            return ctx.error('الأمر ده للمطور بس 👑');
        }

        // ═══ استخرج الهدف ═══
        let targetJid = null;
        let targetNum = null;

        if (ctx.mentioned.length > 0) {
            targetJid = ctx.mentioned[0];
            targetNum = targetJid.split('@')[0].split(':')[0];
        } else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;
            targetNum = targetJid.split('@')[0].split(':')[0];
        } else if (ctx.args[0] && /^[0-9+\s-]+$/.test(ctx.args[0])) {
            targetNum = ctx.args[0].replace(/\D/g, '');
            targetJid = targetNum + '@s.whatsapp.net';
        } else if (ctx.args[0] === 'الكل' || ctx.args[0] === 'all') {
            // فك الكل
            let report = {};
            try { report.wa = db.prepare("UPDATE wa_blocks SET unblocked_at = strftime('%s','now') WHERE unblocked_at IS NULL").run().changes; } catch (_) { report.wa = 0; }
            try { report.ab = db.prepare('DELETE FROM ai_blocks').run().changes; } catch (_) { report.ab = 0; }
            try { report.am = db.prepare('UPDATE ai_moderation SET warnings = 0, profanity_count = 0, apology_used = 0, blocked_until = 0').run().changes; } catch (_) { report.am = 0; }
            try { report.as = db.prepare('DELETE FROM ai_silenced').run().changes; } catch (_) { report.as = 0; }
            try { report.ah = db.prepare('DELETE FROM ai_block_history').run().changes; } catch (_) { report.ah = 0; }
            try { report.pb = db.prepare('DELETE FROM pending_blocks').run().changes; } catch (_) { report.pb = 0; }
            try { report.sp = db.prepare('UPDATE antispam SET banned = 0, violations = 0, cooldown_until = 0, msg_count = 0').run().changes; } catch (_) { report.sp = 0; }

            return ctx.card('🔓 فك الحظر عن الكل', [
                { emoji: '📊', title: 'التفاصيل', content:
`واتساب DB: ${report.wa}
حظر البوت: ${report.ab}
تحذيرات: ${report.am}
صمت: ${report.as}
تاريخ حظر: ${report.ah}
طلبات: ${report.pb}
سبام: ${report.sp}` },
                { emoji: '⚠️', title: 'ملاحظة', content: 'واتساب الحقيقي محتاج رفع يدوي' },
            ]);
        }

        if (!targetJid || !targetNum || targetNum.length < 8) {
            return ctx.card('🔓 فك الحظر', [
                { emoji: '📌', title: 'الاستخدام', content: '.فك @شخص\n.فك [رقم]\n.فك الكل (كله)' },
                { emoji: '💡', title: 'أمثلة', content: '.فك <الرقم>\n.فك @شخص\n.فك الكل' },
            ]);
        }

        // ═══ نفذ الفك ═══
        let report = {};

        try { report.ab = db.prepare('DELETE FROM ai_blocks WHERE user_jid = ?').run(targetJid).changes; } catch (_) { report.ab = 0; }
        try { report.am = db.prepare('UPDATE ai_moderation SET warnings = 0, profanity_count = 0, apology_used = 0, blocked_until = 0 WHERE user_jid = ?').run(targetJid).changes; } catch (_) { report.am = 0; }
        try { report.as = db.prepare('DELETE FROM ai_silenced WHERE user_jid = ?').run(targetJid).changes; } catch (_) { report.as = 0; }
        try { report.ah = db.prepare('DELETE FROM ai_block_history WHERE user_jid = ?').run(targetJid).changes; } catch (_) { report.ah = 0; }
        try { report.pb = db.prepare('DELETE FROM pending_blocks WHERE user_jid = ?').run(targetJid).changes; } catch (_) { report.pb = 0; }
        try { report.sp = db.prepare('UPDATE antispam SET banned = 0, violations = 0, cooldown_until = 0, msg_count = 0 WHERE user_jid = ?').run(targetJid).changes; } catch (_) { report.sp = 0; }
        try { report.wa = db.prepare("UPDATE wa_blocks SET unblocked_at = strftime('%s','now') WHERE user_jid = ? AND unblocked_at IS NULL").run(targetJid).changes; } catch (_) { report.wa = 0; }

        // رفع من واتساب
        let waOk = false;
        try {
            const r = await waBlock.unblockOnWhatsApp(ctx.sock, targetJid);
            waOk = r.ok;
        } catch (_) {}

        await ctx.card('🔓 تم فك الحظر', [
            { emoji: '📱', title: 'الرقم', content: `+${targetNum}` },
            { emoji: waOk ? '✅' : '⚠️', title: 'واتساب', content: waOk ? 'اترفع ✅' : 'فشل — ارفع يدوياً' },
            { emoji: '📊', title: 'التفاصيل', content:
`حظر البوت: ${report.ab}
تحذيرات: ${report.am}
صمت: ${report.as}
تاريخ: ${report.ah}
طلبات: ${report.pb}
سبام: ${report.sp}` },
        ], [targetJid]);

        console.log(`🔓 UNBAN: +${targetNum} — WA:${waOk}`);
    }
};
