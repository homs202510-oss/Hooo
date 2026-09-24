module.exports = {
    name: 'سرعة',
    aliases: ['ping2'],
    desc: 'قياس سرعة البوت',
    async run(ctx) {
        const start = Date.now();
        const sent = await ctx.reply('🏓 جاري القياس...');
        const elapsed = Date.now() - start;

        await new Promise(r => setTimeout(r, 100));

        await ctx.sock.sendMessage(ctx.jid, {
            text: `🏓 *Pong!*\n\n⚡ السرعة: *${elapsed}ms*\n📡 الاتصال: ${elapsed < 500 ? 'ممتاز ✅' : elapsed < 1500 ? 'جيد 👍' : 'بطيء ⚠️'}`,
            edit: sent.key,
        });
    }
};
