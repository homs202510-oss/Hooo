const ai = require('./mod-ai');
const aiCtx = require('./mod-aiContext');
const aiMemory = require('./mod-aiMemory');
const aiState = require('./mod-aiState');
const activity = require('./mod-activity');
const user = require('./mod-user');
const blocks = require('./mod-blocks');

module.exports = {
    name: 'اسأل',
    aliases: ['ask', 'سؤال'],
    desc: 'اسأل الشبح',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        if (blocks.isBlocked(ctx.sender)) return ctx.error('مش مسموحلك');

        const text = ctx.args.join(' ').trim();
        if (!text) {
            return ctx.card('❓ اسأل', [
                { emoji: '💬', title: 'الطريقة', content: '.اسأل [سؤالك]' },
            ]);
        }

        const rate = aiState.canRequest(ctx.sender);
        if (!rate.ok) return ctx.error(`⏳ استنى ${rate.wait} ثانية`);

        activity.trackAiMsg(ctx.sender);
        aiState.incrementMsg(ctx.sender);
        aiMemory.addConvo(ctx.sender, 'user', text);

        const intent = ai.detectIntent(text);
        const history = aiMemory.getConvo(ctx.sender, 6);
        const memories = aiMemory.getMemory(ctx.sender, 8);

        // لو المستخدم استخدم ".اسأل" بنية صريحة → خلينا aboutBot = true عشان يجيب بيانات
        const fullPrompt = aiCtx.buildPrompt(ctx.sender, ctx.pushName, text, {
            aboutBot: true, // صريح: اسأل → عايز إجابة بمعلومات
            memories,
        });

        try { await ctx.sock.sendPresenceUpdate('composing', ctx.jid); } catch (_) {}

        const result = await ai.generate(fullPrompt, { history, temperature: 0.6, maxTokens: 500 });

        try { await ctx.sock.sendPresenceUpdate('paused', ctx.jid); } catch (_) {}

        const reply = result.ok ? result.text : ai.fallbackReply(text);
        aiMemory.addConvo(ctx.sender, 'assistant', reply);
        aiState.incrementAiMsg(ctx.sender);

        await ctx.reply(`👻 ${reply}`);
    }
};
