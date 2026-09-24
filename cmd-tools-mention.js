const user = require('./mod-user');
const dev = require('./mod-developer');

// Cooldown 60 ثانية (للمستخدمين العاديين بس)
const cooldowns = new Map();
const COOLDOWN = 60 * 1000;

module.exports = {
    name: 'منشن',
    aliases: ['mention', 'tagall'],
    desc: 'منشن للكل',
    groupOnly: true,
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        // ✅ المطور والمالك مش عليهم cooldown
        const isProtected = user.isOwner(ctx.sender) || dev.isDeveloper(ctx.sender);

        if (!isProtected) {
            const last = cooldowns.get(ctx.sender) || 0;
            const now = Date.now();
            if (now - last < COOLDOWN) {
                const wait = Math.ceil((COOLDOWN - (now - last)) / 1000);
                return ctx.error(`⏳ استنى ${wait} ثانية`);
            }
            cooldowns.set(ctx.sender, now);
        }

        let meta = ctx.groupMetadata;
        if (!meta) { try { meta = await ctx.sock.groupMetadata(ctx.jid); } catch (_) {} }
        if (!meta) return ctx.error('مش قادر أجيب الأعضاء');

        const members = (meta.participants || []).map(p => p.id || p.jid).filter(Boolean);
        if (!members.length) return ctx.error('مفيش أعضاء');

        const text = ctx.args.join(' ').trim() || '📢 تنبيه';

        try {
            await ctx.sock.sendMessage(ctx.jid, {
                text,
                mentions: members,
            });
        } catch (e) {
            return ctx.error('فشل الإرسال');
        }
    }
};
