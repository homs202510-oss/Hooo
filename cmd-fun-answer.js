const questions = [
    { q: 'إيه عاصمة مصر؟', a: 'القاهرة', points: 1 },
    { q: 'كم عدد أيام السنة الميلادية؟', a: '365', points: 1 },
    { q: 'إيه أكبر كوكب في المجموعة الشمسية؟', a: 'المشتري', points: 1 },
    { q: 'إيه الحيوان اللي بيُلقب بسفينة الصحراء؟', a: 'الجمل', points: 1 },
    { q: 'كم قارة في العالم؟', a: '7', points: 3 },
    { q: 'إيه أطول نهر في العالم؟', a: 'النيل', points: 3 },
    { q: 'إيه العنصر الكيميائي اللي رمزه O؟', a: 'الأكسجين', points: 3 },
    { q: 'كم لون في قوس قزح؟', a: '7', points: 3 },
    { q: 'في أي عام انتهت الحرب العالمية الثانية؟', a: '1945', points: 5 },
    { q: 'إيه أسرع حيوان بري؟', a: 'الفهد', points: 5 },
];

module.exports = {
    name: 'جواب',
    aliases: ['answer'],
    desc: 'جواب الكويز',
    async run(ctx) {
        const guess = ctx.args.join(' ').trim();
        if (!guess) {
            return ctx.error('اكتب جوابك\n مثال: .جواب القاهرة');
        }

        const match = questions.find(q => q.a.toLowerCase() === guess.toLowerCase() || q.a === guess);

        if (match) {
            await ctx.success(`الجواب صح! 🎉\n\n ${match.a}\n\n +${match.points} نقطة`);
        } else {
            await ctx.error(`الجواب غلط 😔\n\n حاول تاني`);
        }
    }
};
