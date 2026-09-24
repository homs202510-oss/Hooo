const ai = require('./mod-ai');
const aiCtx = require('./mod-aiContext');
const aiMemory = require('./mod-aiMemory');
const aiState = require('./mod-aiState');
const activity = require('./mod-activity');
const user = require('./mod-user');
const blocks = require('./mod-blocks');

module.exports = {
    name: 'ai',
    aliases: ['شبح', 'فانتوم', 'phantom'],
    desc: 'كلم الشبح',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        if (blocks.isBlocked(ctx.sender)) return ctx.error('مش مسموحلك');

        if (!aiState.isEnabled(ctx.sender)) aiState.setEnabled(ctx.sender, true);

        const text = ctx.args.join(' ').trim();
        if (!text) {
            return ctx.card('👻 الشبح', [
                { emoji: '💬', title: 'كلمني', content: 'اكتب: .ai [سؤالك]\nأو ابعت رسالة عادية في الخاص' },
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

        const fullPrompt = aiCtx.buildPrompt(ctx.sender, ctx.pushName, text, {
            aboutBot: intent.aboutBot,
            memories,
        });

        try { await ctx.sock.sendPresenceUpdate('composing', ctx.jid); } catch (_) {}

        const result = await ai.generate(fullPrompt, {
            history,
            temperature: intent.aboutBot ? 0.7 : 0.95,
            maxTokens: 400,
        });

        try { await ctx.sock.sendPresenceUpdate('paused', ctx.jid); } catch (_) {}

        const reply = result.ok ? result.text : ai.fallbackReply(text);
        aiMemory.addConvo(ctx.sender, 'assistant', reply);
        aiState.incrementAiMsg(ctx.sender);

        await ctx.reply(`👻 ${reply}`);
    }
};
