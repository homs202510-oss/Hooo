const aiMemory = require('./mod-aiMemory');
const user = require('./mod-user');

module.exports = {
    name: 'ذاكرة',
    aliases: ['memory'],
    desc: 'ذاكرة الشبح عنك',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);
        const arg = ctx.args[0];

        if (arg === 'مسح' || arg === 'امسح') {
            aiMemory.clearMemory(ctx.sender);
            aiMemory.clearConvo(ctx.sender);
            return ctx.success('تم مسح ذاكرة الشبح عنك');
        }

        if (arg === 'امسح' && ctx.args[1] === 'المحادثة') {
            aiMemory.clearConvo(ctx.sender);
            return ctx.success('تم مسح سياق المحادثة');
        }

        const memories = aiMemory.getMemory(ctx.sender, 20);
        const count = aiMemory.getMemoryCount(ctx.sender);

        if (!memories.length) {
            return ctx.card('🧠 ذاكرة الشبح', [
                { emoji: '💭', title: 'مفيش معلومات محفوظة', content: 'الشبح لسه ميعرفش حاجة عنك' },
                { emoji: '💡', title: 'كيف يحفظ', content: 'لما تكلمه في الخاص، بيحفظ حاجات مهمة' },
            ]);
        }

        const content = memories.map((m, i) => `${i + 1}. ${m.fact}`).join('\n');

        await ctx.card('🧠 ذاكرة الشبح', [
            { emoji: '📖', title: `المعلومات (${count})`, content },
            { emoji: '💡', title: 'مسح', content: '.ذاكرة مسح — لحذف الكل' },
        ]);
    }
};
