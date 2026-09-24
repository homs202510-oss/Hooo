const user = require('./mod-user');

const MAX_LENGTH = 20;
const MIN_LENGTH = 2;
const VALID_PATTERN = /^[\u0600-\u06FFa-zA-Z0-9 _\-]+$/;

module.exports = {
    name: 'اسم',
    aliases: ['name', 'setname'],
    desc: 'تغيير اسمك داخل البوت',
    async run(ctx) {
        const newName = ctx.args.join(' ').trim();

        if (!newName) {
            return ctx.card('تغيير الاسم', [
                { emoji: '📝', title: 'الاستخدام', content: ' .اسم [الاسم الجديد]\n مثال: .اسم محمد' },
                { emoji: '💡', title: 'ملاحظة', content: ' الاسم ده داخل البوت فقط\n مش بيأثر على اسم واتساب' },
                { emoji: '📏', title: 'الحدود', content: ` من ${MIN_LENGTH} لـ ${MAX_LENGTH} حرف` },
            ]);
        }

        if (newName.length < MIN_LENGTH) {
            return ctx.error(`الاسم قصير جداً — الحد الأدنى ${MIN_LENGTH} حرف`);
        }

        if (newName.length > MAX_LENGTH) {
            return ctx.error(`الاسم طويل جداً — الحد الأقصى ${MAX_LENGTH} حرف`);
        }

        if (!VALID_PATTERN.test(newName)) {
            return ctx.error('الاسم يحتوي على رموز غير مسموحة');
        }

        user.getOrCreate(ctx.sender, ctx.pushName);
        user.setName(ctx.sender, newName);

        await ctx.success(`تم تغيير اسمك إلى:\n\n ${newName}`);
    }
};
