module.exports = {
    name: 'وقت',
    aliases: ['time'],
    desc: 'الوقت والتاريخ',
    async run(ctx) {
        const now = new Date();
        const options = { timeZone: 'Africa/Cairo', hour12: true, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        const formatted = now.toLocaleString('ar-EG', options);

        await ctx.card('🕐 الوقت الحالي', [
            { emoji: '🇪🇬', title: 'توقيت القاهرة', content: formatted },
        ]);
    }
};
