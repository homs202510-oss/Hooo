const kd = require('./mod-kingdom');
const user = require('./mod-user');

module.exports = {
    name: 'إنشاء',
    aliases: ['create', 'انشاء'],
    desc: 'إنشاء مملكة جديدة',
    async run(ctx) {
        user.getOrCreate(ctx.sender, ctx.pushName);

        if (kd.hasKingdom(ctx.sender)) {
            const k = kd.getKingdom(ctx.sender);
            return ctx.error(`عندك مملكة بالفعل اسمها: ${k.name}`);
        }

        const name = ctx.args.join(' ').trim();

        if (!name) {
            return ctx.card('إنشاء مملكة', [
                { emoji: '🏰', title: 'الطريقة', content: '.إنشاء [اسم المملكة]\nمثال: .إنشاء مملكة الشبح' },
                { emoji: '📏', title: 'الحدود', content: `من 3 لـ ${kd.MAX_NAME_LENGTH} حرف` },
                { emoji: '🎁', title: 'هدية البداية', content: '🪵 1000 خشب\n🪨 1000 حجر\n🌾 1000 قمح\n🪙 500 ذهب\n⛏️ 100 حديد' },
            ]);
        }

        if (name.length < 3) return ctx.error('اسم المملكة قصير جداً (أقل من 3 أحرف)');
        if (name.length > kd.MAX_NAME_LENGTH) return ctx.error(`اسم المملكة طويل جداً (أكتر من ${kd.MAX_NAME_LENGTH} حرف)`);

        const result = kd.createKingdom(ctx.sender, name);
        if (!result.ok) {
            if (result.reason === 'exists') return ctx.error('عندك مملكة بالفعل!');
            return ctx.error('فشل إنشاء المملكة، حاول تاني');
        }

        await ctx.card('مبروك! 🎉', [
            { emoji: '🏰', title: 'المملكة', content: `${name}\nالمستوى: 1\nالقوة: 100` },
            { emoji: '🎁', title: 'الموارد الابتدائية', content: '🪵 1000 خشب\n🪨 1000 حجر\n🌾 1000 قمح\n🪙 500 ذهب\n⛏️ 100 حديد' },
            { emoji: '💡', title: 'الخطوة الجاية', content: '.مملكة — عرض معلوماتك\n.بناء — عرض المباني\n.تطوير — ترقية المملكة' },
        ]);
    }
};
