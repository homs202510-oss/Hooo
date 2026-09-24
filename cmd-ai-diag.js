/**
 * 🔧 أمر تشخيص AI — للمطور فقط
 * .تشخيص
 */
const router = require('./mod-conversationRouter');
const conv = require('./mod-conversation');
const aiState = require('./mod-aiState');
const dev = require('./mod-developer');
const user = require('./mod-user');

module.exports = {
    name: 'تشخيص',
    aliases: ['diag', 'debug'],
    desc: 'تشخيص حالة AI',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        if (!dev.isPrivileged(ctx.sender)) {
            return ctx.error('الأمر ده للمطور بس 👑');
        }

        const botJids = router.getBotJids(ctx.sock);
        const ctxInfo = router.getContextInfo(ctx.msg);
        const convState = conv.getUserState(ctx.sender);
        const groupState = ctx.isGroup ? conv.getGroupState(ctx.jid) : null;
        const aiS = aiState.getState(ctx.sender);

        const blocks = [
            {
                emoji: '🤖', title: 'حالة البوت',
                content: `Bot JIDs:\n${botJids.map(j => '  ' + j).join('\n') || 'مفيش'}`,
            },
            {
                emoji: '💬', title: 'حالة Conversation',
                content: `User mode: ${conv.isUserEnabled(ctx.sender) ? '✅ مفعّل' : '❌ مقفول'}
Group mode: ${ctx.isGroup ? (conv.isGroupEnabled(ctx.jid) ? '✅' : '❌') : 'مش جروب'}
Activated: ${convState?.activated_at ? new Date(convState.activated_at * 1000).toLocaleString('ar-EG') : 'لسه'}`,
            },
            {
                emoji: '📨', title: 'الرسالة الحالية',
                content: ctxInfo
                    ? `contextInfo موجود ✅
Participant: ${ctxInfo.participant || 'مفيش'}
Mentions: ${(ctxInfo.mentionedJid || []).join(', ') || 'مفيش'}`
                    : 'مفيش contextInfo (دي مش Reply)',
            },
            {
                emoji: '🧠', title: 'حالة AI',
                content: `Enabled: ${aiS.enabled ? '✅' : '❌'}
Total msgs: ${aiS.total_msgs}
AI msgs: ${aiS.ai_msgs}
Last AI: ${aiS.last_ai_at ? new Date(aiS.last_ai_at * 1000).toLocaleString('ar-EG') : 'لسه'}`,
            },
            {
                emoji: '💡', title: 'اختبار',
                content: 'Reply على رسالتي دي وشوف:\n🔍 Directed: true\n✅ رد AI\nفي Termux',
            },
        ];

        await ctx.card('🔧 تشخيص PHANTOM AI', blocks);
    }
};
