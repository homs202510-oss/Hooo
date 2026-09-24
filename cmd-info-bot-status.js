const status = require('./svc-status');

module.exports = {
    name: 'حالة_البوت',
    aliases: ['botstatus'],
    desc: 'حالة البوت',
    async run(ctx) {
        const s = status.getStatus();

        await ctx.card('👻 حالة PHANTOM', [
            { emoji: '⏱️', title: 'Uptime', content: s.uptime },
            { emoji: '💾', title: 'RAM', content: `${s.memory.used} / ${s.memory.total} GB (${s.memory.percent}%)\nعملية البوت: ${s.memory.processMB} MB` },
            { emoji: '🟢', title: 'Node.js', content: s.node },
            { emoji: '📚', title: 'Baileys', content: s.baileys },
            { emoji: '📦', title: 'Plugins', content: `${s.plugins} أمر` },
            { emoji: '👥', title: 'المستخدمين', content: `${s.users}` },
            { emoji: '💬', title: 'جروبات مفعلة', content: `${s.groups}` },
            { emoji: '🗄️', title: 'قاعدة البيانات', content: s.dbOk ? '✅ متصلة' : '❌ مشكلة' },
            { emoji: '🤖', title: 'AI', content: s.aiOk ? '✅ متاح' : '❌ مش مفعل' },
            { emoji: '🎬', title: 'FFmpeg', content: s.ffmpegOk ? '✅ مثبت' : '❌ مش موجود' },
        ]);
    }
};
