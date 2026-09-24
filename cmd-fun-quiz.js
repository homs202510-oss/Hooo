const questions = [
    { q: 'إيه عاصمة مصر؟', a: 'القاهرة', level: 'سهل', points: 1 },
    { q: 'كم عدد أيام السنة الميلادية؟', a: '365', level: 'سهل', points: 1 },
    { q: 'إيه أكبر كوكب في المجموعة الشمسية؟', a: 'المشتري', level: 'سهل', points: 1 },
    { q: 'إيه الحيوان اللي بيُلقب بسفينة الصحراء؟', a: 'الجمل', level: 'سهل', points: 1 },
    { q: 'كم قارة في العالم؟', a: '7', level: 'متوسط', points: 3 },
    { q: 'إيه أطول نهر في العالم؟', a: 'النيل', level: 'متوسط', points: 3 },
    { q: 'إيه العنصر الكيميائي اللي رمزه O؟', a: 'الأكسجين', level: 'متوسط', points: 3 },
    { q: 'كم لون في قوس قزح؟', a: '7', level: 'متوسط', points: 3 },
    { q: 'في أي عام انتهت الحرب العالمية الثانية؟', a: '1945', level: 'صعب', points: 5 },
    { q: 'إيه أسرع حيوان بري؟', a: 'الفهد', level: 'صعب', points: 5 },
    { q: 'كم عدد عظام جسم الإنسان البالغ؟', a: '206', level: 'صعب', points: 5 },
    { q: 'إيه أصغر دولة في العالم؟', a: 'الفاتيكان', level: 'صعب', points: 5 },
    { q: 'إيه أغلى معدن في العالم؟', a: 'الروديوم', level: 'أسطوري', points: 10 },
    { q: 'كم سنة ضوئية يبعد أقرب نجم عن الأرض؟', a: '4.2', level: 'أسطوري', points: 10 },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

module.exports = {
    name: 'صح',
    aliases: ['quiz', 'كويز', 'سؤال'],
    desc: 'سؤال وجواب بمستويات',
    async run(ctx) {
        const q = pick(questions);
        const emojiLevel = { 'سهل': '🟢', 'متوسط': '🟡', 'صعب': '🟠', 'أسطوري': '🔴' };

        await ctx.card('سؤال وجواب', [
            { emoji: '❓', title: 'السؤال', content: ` ${q.q}` },
            { emoji: emojiLevel[q.level] || '⚪', title: 'المستوى', content: ` ${q.level}` },
            { emoji: '🎁', title: 'الجائزة', content: ` ${q.points} نقطة` },
            { emoji: '💡', title: 'الطريقة', content: ` اكتب: .جواب ${q.a}` },
            { emoji: '⏱️', title: 'الوقت', content: ' عندك 30 ثانية' },
        ]);
    }
};
