const user = require('./mod-user');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'ايدي',
    aliases: ['id'],
    desc: 'الـ ID بتاعك',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const lines = [`👤 *أنت:* ${ctx.senderNumber}`];
        if (ctx.isGroup) {
            lines.push(`👥 *الجروب:* ${extractNumber(ctx.jid)}`);
            lines.push(`📝 *اسمك:* ${ctx.pushName}`);
        }
        await ctx.card('🆔 ID', [
            { emoji: '🆔', title: 'المعلومات', content: lines.join('\n') },
        ]);
    }
};
