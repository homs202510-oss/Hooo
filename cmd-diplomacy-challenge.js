const kd = require('./mod-kingdom');
const dp = require('./mod-diplomacy');
const user = require('./mod-user');

module.exports = {
    name: 'تحدي',
    aliases: ['challenge'],
    desc: 'تحدي مملكة أخرى',
    groupOnly: true,
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const myK = kd.getKingdom(ctx.sender);

        if (!myK) {
            return ctx.error('محتاج تنشئ مملكة الأول\n.إنشاء [اسم المملكة]');
        }

        let targetJid = null;
        if (ctx.mentioned.length > 0) targetJid = ctx.mentioned[0];
        else if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = ctx.msg.message.extendedTextMessage.contextInfo.participant;
        }

        if (!targetJid) {
            return ctx.card('التحدي', [
                { emoji: '⚔️', title: 'الطريقة', content: '.تحدي @شخص\nأو الرد على رسالة الشخص' },
            ]);
        }

        const targetNumber = targetJid.split('@')[0].split(':')[0];
        if (targetNumber === ctx.senderNumber) {
            return ctx.error('مش ممكن تتحدي نفسك');
        }

        user.getOrCreate(targetJid);
        const otherK = kd.getKingdom(targetJid);
        if (!otherK) {
            return ctx.error('الطرف الآخر معندوش مملكة');
        }

        const result = dp.createChallenge(myK.id, otherK.id);

        if (!result.ok) {
            if (result.reason === 'already_pending') return ctx.error('فيه تحدي معلق بالفعل');
            if (result.reason === 'already_active') return ctx.error('فيه تحدي نشط بالفعل');
            if (result.reason === 'self') return ctx.error('مش ممكن');
            return ctx.error('فشل إنشاء التحدي');
        }

        if (result.action === 'accepted') {
            return ctx.card('تحدي مقبول! ⚔️', [
                { emoji: '🏰', title: 'المملكتان', content: `${myK.name}  ضد  ${otherK.name}` },
                { emoji: '✅', title: 'الحالة', content: 'التحدي نشط الآن' },
                { emoji: '💡', title: 'ملاحظة', content: 'المعارك هتتنفذ قريباً' },
            ], [targetJid]);
        }

        await ctx.card('تحدي جديد ⚔️', [
            { emoji: '🏰', title: 'المتحدي', content: myK.name },
            { emoji: '🎯', title: 'المتحدى', content: `${otherK.name} (@${targetNumber})` },
            { emoji: '⏳', title: 'الحالة', content: 'معلق — يستنى الموافقة' },
            { emoji: '💡', title: 'للطرف الآخر', content: 'اكتب نفس الأمر .تحدي بنفس الشخص للقبول' },
        ], [targetJid]);
    }
};
