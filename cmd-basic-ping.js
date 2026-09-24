const user = require('./mod-user');
const config = require('./config');
const fmt = require('./util-format');

module.exports = {
    name: 'تست',
    aliases: ['ping', 'بينج', 'اختبار'],
    desc: 'اختبار البوت',

    async run(ctx) {
        const u = user.getOrCreate(ctx.sender, ctx.pushName);
        const rank = user.getRank(u);

        const build = (percent) => {
            const filled = Math.floor(percent / 10);
            const bar = '▰'.repeat(filled) + '▱'.repeat(10 - filled);
            const state = percent < 100 ? '⏳ تحميل…' : '✅ مكتمل';
            const status = percent < 100 ? 'جاري التشغيل…' : 'النظام يعمل ✓';

            return `${fmt.header()}

     ❥ ${status} ❥

╭━━━━━━━━━━━━━━━╮
⚡ الحالة    : ${state}
👤 المستخدم  : ${ctx.pushName}
🔰 الرتبة    : ${rank.name}
💠 الطاقة    : ${bar} ${percent}%
🛰️ الاتصال   : مستقر ✓
🏷️ الإصدار   : v1.0
🛡️ المالك    : +${config.ownerNumber}
╰━━━━━━━━━━━━━━━╯

${fmt.footer()}`;
        };

        const sent = await ctx.sock.sendMessage(ctx.jid, {
            text: build(10)
        }, { quoted: ctx.msg });

        for (const p of [20, 30, 40, 50, 60, 70, 80, 90]) {
            await new Promise(r => setTimeout(r, 400));
            try {
                await ctx.sock.sendMessage(ctx.jid, {
                    text: build(p),
                    edit: sent.key
                });
            } catch (e) {}
        }

        await new Promise(r => setTimeout(r, 500));
        try {
            await ctx.sock.sendMessage(ctx.jid, {
                text: build(100),
                edit: sent.key
            });
        } catch (e) {
            await ctx.reply(build(100));
        }
    }
};
