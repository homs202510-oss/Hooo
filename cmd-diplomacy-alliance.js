const kd = require('./mod-kingdom');
const dp = require('./mod-diplomacy');
const user = require('./mod-user');

module.exports = {
    name: 'تحالف',
    aliases: ['alliance', 'تحالف_'],
    desc: 'إنشاء تحالف مع مملكة أخرى',
    groupOnly: true,
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const myK = kd.getKingdom(ctx.sender);

        if (!myK) {
            return ctx.error('محتاج تنشئ مملكة الأول\n.إنشاء [اسم المملكة]');
        }

        // تحديد الطرف الآخر
        let targetJid = null;
        if (ctx.mentioned.length > 0) targetJid = ctx.mentioned[0];
        else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;
        }

        if (!targetJid) {
            return ctx.card('التحالف', [
                { emoji: '🤝', title: 'الطريقة', content: '.تحالف @شخص\nأو الرد على رسالة الشخص' },
                { emoji: '📌', title: 'شرط', content: 'الطرف الآخر لازم يكون عنده مملكة' },
            ]);
        }

        const targetNumber = targetJid.split('@')[0].split(':')[0];
        if (targetNumber === ctx.senderNumber) {
            return ctx.error('مش ممكن تتحالف مع نفسك');
        }

        user.getOrCreate(targetJid);
        const otherK = kd.getKingdom(targetJid);
        if (!otherK) {
            return ctx.error('الطرف الآخر معندوش مملكة');
        }

        const result = dp.createAllianceRequest(myK.id, otherK.id);

        if (!result.ok) {
            if (result.reason === 'already_pending') return ctx.error('فيه طلب تحالف معلق بالفعل');
            if (result.reason === 'already_active') return ctx.error('انتم متحالفين بالفعل! 🤝');
            if (result.reason === 'self') return ctx.error('مش ممكن');
            return ctx.error('فشل إنشاء التحالف');
        }

        if (result.action === 'accepted') {
            return ctx.card('تحالف! 🤝', [
                { emoji: '🏰', title: 'المملكتان', content: `${myK.name}\n  ✦\n${otherK.name}` },
                { emoji: '✅', title: 'الحالة', content: 'التحالف نشط الآن' },
                { emoji: '💡', title: 'ملاحظة', content: 'استخدم .تحالفاتي لعرض تحالفاتك' },
            ], [targetJid]);
        }

        await ctx.card('طلب تحالف 📩', [
            { emoji: '🏰', title: 'من', content: myK.name },
            { emoji: '🎯', title: 'إلى', content: `${otherK.name} (@${targetNumber})` },
            { emoji: '⏳', title: 'الحالة', content: 'معلق — يستنى الموافقة' },
            { emoji: '💡', title: 'للطرف الآخر', content: 'اكتب نفس الأمر .تحالف بنفس الشخص للقبول' },
        ], [targetJid]);
    }
};
