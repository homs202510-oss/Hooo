/**
 * 🎛️ .إدارة — لوحة الإدارة
 */
const state = require('./mod-group-state');
const settings = require('./mod-group-settings');
const mod = require('./mod-group-moderation');
const warn = require('./mod-group-warnings');
const perm = require('./mod-group-permissions');

module.exports = {
    name: 'إدارة',
    aliases: ['panel'],
    desc: 'لوحة الإدارة',
    groupOnly: true,
    async run(ctx) {
        const st = state.getState(ctx.jid);
        const s = settings.get(ctx.jid);
        const admins = (ctx.groupMetadata?.participants || []).filter(p => p.admin).length;
        const bans = mod.listBans(ctx.jid).length;
        const mutes = mod.listMutes(ctx.jid).length;
        const warns = warn.listAll(ctx.jid).length;

        const on = '✅', off = '❌';

        await ctx.card('🎛️ لوحة الإدارة', [
            { emoji: '👻', title: 'PHANTOM', content: st.enabled ? '✅ شغال' : '❌ واقف' },
            { emoji: '👑', title: 'الأدمنز', content: `${admins}` },
            { emoji: '🛡️', title: 'الحماية', content:
                `🔗 ${s.link_protection ? on : off}  📢 ${s.mention_protection ? on : off}  🖼️ ${s.image_protection ? on : off}` },
            { emoji: '📊', title: 'الحالات', content:
                `🚫 محظورين: ${bans}\n🔇 مكتومين: ${mutes}\n⚠️ تحذيرات: ${warns}` },
        ]);
    }
};
