const config = require('./config');

module.exports = {
    name: 'معلومات',
    aliases: ['info', 'معلوماتي'],
    desc: 'معلومات البوت',
    async run(ctx) {
        await ctx.card('معلومات الشبح', [
            { emoji: '👻', title: 'عن البوت', content: ` الاسم     : ${config.botName}\n الإصدار   : v1.0\n الحالة    : يعمل ✅` },
            { emoji: '⚙️', title: 'الإعدادات', content: ` البادئة   : ${config.prefix}\n المالك    : +${config.ownerNumber}` },
            { emoji: '📊', title: 'الإمكانيات', content: ' ◈ أوامر ترفيه\n ◈ نظام بنك\n ◈ مملكة\n ◈ ذكاء اصطناعي' },
        ]);
    }
};
