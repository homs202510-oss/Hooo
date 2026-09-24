/**
 * ⚙️ .إعدادات — عرض إعدادات المجموعة
 */
const settings = require('./mod-group-settings');

module.exports = {
    name: 'إعدادات',
    aliases: ['settings'],
    desc: 'إعدادات المجموعة',
    groupOnly: true,
    async run(ctx) {
        const s = settings.get(ctx.jid);
        const on = '✅', off = '❌';

        await ctx.card('⚙️ إعدادات الجروب', [
            { emoji: '🛡️', title: 'الحماية', content:
                `🔗 الروابط: ${s.link_protection ? on : off}\n📢 المنشن: ${s.mention_protection ? on : off}\n🖼️ الصور: ${s.image_protection ? on : off}\n🎥 الفيديو: ${s.video_protection ? on : off}\n📁 الملفات: ${s.file_protection ? on : off}` },
            { emoji: '👋', title: 'الترحيب', content: `ترحيب: ${s.welcome ? on : off}\nوداع: ${s.goodbye ? on : off}` },
        ]);
    }
};
