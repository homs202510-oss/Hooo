/**
 * 🔓 .فك [رقم] — رفع الحظر الكامل (للمطور فقط)
 */
const db = require('./core-database');
const user = require('./mod-user');
const blocks = require('./mod-blocks');
const waBlock = require('./mod-whatsappBlock');
const dev = require('./mod-developer');

module.exports = {
    name: 'فك',
    aliases: ['فك_الحظر', 'unblock', 'رفع_الحظر'],
    desc: 'رفع الحظر عن رقم (للمطور)',
    hidden: false,

    async run(ctx) {
        // ═══ للمطور فقط ═══
        if (!user.isOwner(ctx.sender) && !dev.isDeveloper(ctx.sender)) {
            return ctx.error('الأمر ده للمطور بس 👑');
        }

        // ═══ استخرج الرقم ═══
        let num = ctx.args[0];

        // لو مفيش args → حاول يستخرج من mention
        if (!num && ctx.mentioned.length > 0) {
            num = ctx.mentioned[0].split('@')[0].split(':')[0];
        }

        // لو مفيش → حاول يستخرج من reply
        if (!num) {
            const replied = ctx.msg.message?.extendedTextMessage?.contextInfo?.participant;
            if (replied) num = replied.split('@')[0].split(':')[0];
        }

        // لو مفيش → عرض الاستخدام
        if (!num) {
            return ctx.card('🔓 فك الحظر', [
                { emoji: '📌', title: 'الاستخدام', content: '.فك [الرقم]\nأو اعمل mention للشخص\nأو اعمل Reply على رسالته' },
                { emoji: '💡', title: 'أمثلة', content: '.فك <الرقم>\n.فك @شخص\nReply على رسالة الشخص' },
            ]);
        }

        // نظّف الرقم
        num = num.replace(/\D/g, '');
        if (num.length < 8) {
            return ctx.error('رقم غير صحيح');
        }

        const targetJid = num + '@s.whatsapp.net';

        // ═══ رفع الحظر من كل الجداول ═══
        let report = [];

        // 1) wa_blocks
        try {
            const r = db.prepare("UPDATE wa_blocks SET unblocked_at = strftime('%s','now') WHERE user_jid = ? AND unblocked_at IS NULL").run(targetJid);
            report.push(`واتساب DB: ${r.changes}`);
        } catch (e) { report.push(`واتساب DB: ⚠️`); }

        // 2) ai_blocks
        try {
            const r = db.prepare('DELETE FROM ai_blocks WHERE user_jid = ?').run(targetJid);
            report.push(`حظر البوت: ${r.changes}`);
        } catch (_) {}

        // 3) ai_moderation
        try {
            const r = db.prepare('UPDATE ai_moderation SET warnings = 0, profanity_count = 0, apology_used = 0, blocked_until = 0 WHERE user_jid = ?').run(targetJid);
            report.push(`تحذيرات: ${r.changes}`);
        } catch (_) {}

        // 4) antispam
        try {
            const r = db.prepare('UPDATE antispam SET banned = 0, violations = 0, cooldown_until = 0, msg_count = 0 WHERE user_jid = ?').run(targetJid);
            report.push(`سبام: ${r.changes}`);
        } catch (_) {}

        // 5) ai_silenced
        try {
            const r = db.prepare('DELETE FROM ai_silenced WHERE user_jid = ?').run(targetJid);
            report.push(`صمت: ${r.changes}`);
        } catch (_) {}

        // 6) ai_block_history
        try {
            const r = db.prepare('DELETE FROM ai_block_history WHERE user_jid = ?').run(targetJid);
            report.push(`تاريخ حظر: ${r.changes}`);
        } catch (_) {}

        // 7) pending_blocks
        try {
            const r = db.prepare('DELETE FROM pending_blocks WHERE user_jid = ?').run(targetJid);
            report.push(`طلبات حظر: ${r.changes}`);
        } catch (_) {}

        // ═══ رفع الحظر من واتساب (الأهم) ═══
        let waOk = false;
        try {
            const r = await waBlock.unblockOnWhatsApp(ctx.sock, targetJid);
            waOk = r.ok;
        } catch (_) {}

        // ═══ الرد ═══
        const waStatus = waOk ? '✅ واتساب: اترفع' : '⚠️ واتساب: فشل (ارفع يدوياً)';

        await ctx.card('🔓 رفع الحظر', [
            { emoji: '📱', title: 'الرقم', content: `+${num}` },
            { emoji: waOk ? '✅' : '⚠️', title: 'الحالة', content: waStatus },
            { emoji: '📊', title: 'التفاصيل', content: report.join('\n') },
            ...(waOk ? [] : [{
                emoji: '💡',
                title: 'رفع يدوي',
                content: 'واتساب بتاع البوت →\nالإعدادات → الحساب → الخصوصية →\nجهات الاتصال المحظورة → احذف الرقم'
            }]),
        ]);

        console.log(`🔓 Unblock: +${num} — ${waOk ? 'WA+DB' : 'DB only'}`);
    }
};
