const options = ['حجرة', 'ورقة', 'مقص'];
const emojis = { 'حجرة': '🪨', 'ورقة': '📄', 'مقص': '✂️' };
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

module.exports = {
    name: 'لعبة',
    aliases: ['rps', 'حجرة', 'game'],
    desc: 'حجرة ورقة مقص',
    async run(ctx) {
        const choice = ctx.args[0];

        if (!choice || !options.includes(choice)) {
            return ctx.card('حجرة ورقة مقص', [
                { emoji: '🎮', title: 'طريقة اللعب', content: ' .لعبة حجرة\n .لعبة ورقة\n .لعبة مقص' },
                { emoji: '📌', title: 'القوانين', content: ' 🪨 حجرة تكسر ✂️ مقص\n 📄 ورقة تغطي 🪨 حجرة\n ✂️ مقص يقص 📄 ورقة' },
                { emoji: '🏆', title: 'النقاط', content: ' كل فوز = 3 نقاط\n كل تعادل = 1 نقطة' },
            ]);
        }

        const bot = pick(options);
        let result, emoji, points;
        if (choice === bot) { result = 'تعادل'; emoji = '🤝'; points = 1; }
        else if ((choice === 'حجرة' && bot === 'مقص') || (choice === 'ورقة' && bot === 'حجرة') || (choice === 'مقص' && bot === 'ورقة')) {
            result = 'كسبت'; emoji = '🎉'; points = 3;
        } else { result = 'خسرت'; emoji = '😢'; points = 0; }

        // جملة تشجيعية
        const cheer = result === 'كسبت' ? pick(['بطل! 🔥', 'شبح بيخاف منك 👻', 'كمل كده 💪'])
            : result === 'تعادل' ? pick(['قريب جداً! 🎯', 'المرة الجاية تكسب 🍀'])
            : pick(['حظ أوفر 🌧️', 'حاول تاني 💭', 'الشبح بيغش 😏']);

        await ctx.card('نتيجة اللعبة', [
            { emoji: '👤', title: 'اختيارك', content: ` ${emojis[choice]} ${choice}` },
            { emoji: '👻', title: 'اختيار الشبح', content: ` ${emojis[bot]} ${bot}` },
            { emoji, title: 'النتيجة', content: ` ${emoji} ${result}` },
            { emoji: '🎁', title: 'النقاط', content: ` +${points} نقطة` },
            { emoji: '💬', title: 'تعليق الشبح', content: ` ${cheer}` },
        ]);
    }
};
