/**
 * 👻 .حالة_البوت — حالة البوت في الجروب
 */
const state = require('./mod-group-state');
const settings = require('./mod-group-settings');
const mod = require('./mod-group-moderation');
const warnings = require('./mod-group-warnings');
const dev = require('./mod-developer');
const user = require('./mod-user');

module.exports = {
    name: 'حالة_البوت',
    aliases: ['حالة', 'status'],
    desc: 'حالة PHANTOM في الجروب',
    async run(ctx) {
        if (!ctx.isGroup) return ctx.error('الأمر ده في الجروبات بس');

        const s = state.getState(ctx.jid);
        const cfg = settings.get(ctx.jid);
        const bans = mod.listBans(ctx.jid).length;
        const mutes = mod.listMutes(ctx.jid).length;
        const warns = warnings.listAll(ctx.jid).length;

        const statusIcon = s.enabled ? '✅ شغال' : '❌ واقف';

        await ctx.card('👻 حالة PHANTOM', [
            { emoji: s.enabled ? '✅' : '🚫', title: 'الحالة', content: statusIcon },
            { emoji: '🛡️', title: 'الحماية',
              content: `🔗 الروابط: ${cfg.link_protection ? '✅' : '❌'}\n📢 المنشن: ${cfg.mention_protection ? '✅' : '❌'}\n🖼️ الصور: ${cfg.image_protection ? '✅' : '❌'}\n🎥 الفيديو: ${cfg.video_protection ? '✅' : '❌'}\n📁 الملفات: ${cfg.file_protection ? '✅' : '❌'}` },
            { emoji: '📊', title: 'الإحصائيات',
              content: `🚫 محظورين: ${bans}\n🔇 مكتومين: ${mutes}\n⚠️ تحذيرات: ${warns}` },
        ]);
    }
};
