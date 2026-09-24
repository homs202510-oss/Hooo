const state = require('./mod-group-state');
const settings = require('./mod-group-settings');
const user = require('./mod-user');
const { extractNumber } = require('./mod-jid');

module.exports = {
    name: 'معلومات_الجروب',
    aliases: ['groupinfo'],
    desc: 'معلومات الجروب',
    groupOnly: true,
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        let meta = ctx.groupMetadata;
        if (!meta) { try { meta = await ctx.sock.groupMetadata(ctx.jid); } catch (_) {} }
        if (!meta) return ctx.error('مش قادر أجيب معلومات الجروب');

        const admins = (meta.participants || []).filter(p => p.admin).length;
        const st = state.getState(ctx.jid);
        const cfg = settings.get(ctx.jid);
        const on = '✅', off = '❌';

        const ownerNum = meta.owner ? extractNumber(meta.owner) : 'مش معروف';

        await ctx.card(`📊 ${meta.subject || 'الجروب'}`, [
            { emoji: '👥', title: 'الأعضاء', content: `الإجمالي: ${meta.participants?.length || 0}\nالمشرفين: ${admins}` },
            { emoji: '👑', title: 'المالك', content: `@${ownerNum}` },
            { emoji: st.enabled ? '✅' : '🚫', title: 'PHANTOM', content: st.enabled ? 'شغال' : 'واقف' },
            { emoji: '🛡️', title: 'الحماية',
              content: `🔗 الروابط: ${cfg.link_protection ? on : off}\n📢 المنشن: ${cfg.mention_protection ? on : off}\n🖼️ الصور: ${cfg.image_protection ? on : off}` },
            { emoji: '👋', title: 'الترحيب/الوداع', content: `ترحيب: ${cfg.welcome ? on : off}\nوداع: ${cfg.goodbye ? on : off}` },
        ], meta.owner ? [meta.owner] : []);
    }
};
