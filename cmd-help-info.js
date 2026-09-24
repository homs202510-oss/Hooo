/**
 * 👻 .معلومات — معلومات ديناميكية
 */
const user = require('./mod-user');
const kd = require('./mod-kingdom');
const db = require('./core-database');

module.exports = {
    name: 'معلومات',
    aliases: ['about', 'botinfo'],
    desc: 'معلومات البوت',
    async run(ctx) {
        const u = user.getOrCreate(ctx.sender, ctx.pushName);
        const k = kd.getKingdom(ctx.sender);

        const users = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
        const groups = db.prepare('SELECT COUNT(*) as c FROM group_states WHERE enabled = 1').get().c;
        const kingdoms = db.prepare('SELECT COUNT(*) as c FROM kingdoms').get().c;

        const status = require('./svc-status');
        const s = status.getStatus();

        const blocks = [
            {
                emoji: '👻', title: 'PHANTOM BOT',
                content: `🤖 بوت واتساب متكامل\n👤 المطور: حمص\n🏷️ شبح يراقب\n📦 ${s.plugins} أمر`,
            },
            {
                emoji: '📊', title: 'إحصائيات',
                content: `👥 مستخدمين: ${users.toLocaleString('ar-EG')}\n🏰 ممالك: ${kingdoms.toLocaleString('ar-EG')}\n💬 جروبات: ${groups.toLocaleString('ar-EG')}`,
            },
            {
                emoji: '💡', title: 'ابدأ', content: '.دليل — تعلم البوت\n.مساعدة — أقسام المساعدة\n.اوامر — كل الأوامر' },
        ];

        // لو عنده مملكة → نضيف حالته
        if (k) {
            blocks.splice(2, 0, {
                emoji: '👤', title: 'حالتك',
                content: `🏰 ${k.name} — Lv${k.level}\n💰 ${u.coins.toLocaleString('ar-EG')} نقطة`,
            });
        }

        await ctx.card('معلومات', blocks);
    }
};
