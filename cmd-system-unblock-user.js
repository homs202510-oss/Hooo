/**
 * 👑 .رفع_الحظر — للمطور فقط
 * يرفع الحظر الحقيقي من واتساب
 */
const waBlock = require('./mod-whatsappBlock');
const blocks = require('./mod-blocks');
const mod = require('./mod-aiModeration');
const dev = require('./mod-developer');

module.exports = {
    name: 'رفع_الحظر',
    aliases: ['رفع-الحظر', 'unblock'],
    desc: 'رفع الحظر من واتساب (للمطور)',
    async run(ctx) {
        if (!dev.isPrivileged(ctx.sender)) {
            return ctx.error('الأمر ده للمطور بس 👑');
        }

        const numArg = ctx.args[0];
        if (!numArg) {
            return ctx.card('رفع الحظر', [
                { emoji: '📌', title: 'الاستخدام', content: '.رفع_الحظر [الرقم]\nمثال: .رفع_الحظر <الرقم>' },
            ]);
        }

        const num = numArg.replace(/\D/g, '');
        if (!num || num.length < 8) {
            return ctx.error('رقم غير صحيح');
        }

        const targetJid = num + '@s.whatsapp.net';

        // رفع من واتساب
        const waResult = await waBlock.unblockOnWhatsApp(ctx.sock, targetJid);

        // رفع من DB
        blocks.unblock(targetJid);
        mod.resetWarnings(targetJid);

        if (waResult.ok) {
            return ctx.success(`✅ تم رفع الحظر من واتساب\n📱 +${num}`);
        } else {
            return ctx.error(`فشل رفع الحظر من واتساب\n\n${waResult.error || 'خطأ'}\n\n(لكن اترفع من نظام البوت)`);
        }
    }
};
