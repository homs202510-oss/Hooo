const advices = [
    'احذر في قراراتك النهاردة، حاجة مش تمام مستنياك 🤔',
    'يومك هيبقى مليان خير، ابدأ بنية صافية 🌟',
    'ركز في شغلك، النهاردة فرصتك ⚡',
    'اتصل بصاحبك اللي واحشك، هيغير يومك 📞',
    'اتعلم حاجة جديدة، هيبقى لها مردود 👨‍🎓',
    'دلل نفسك شوية، تستاهل 🍕',
    'قلل الكلام، اسمع أكتر 👂',
    'قرر حاجة كنت مؤجلها، هترتاح 😌',
];

const doList = [
    'اشرب كوباية مية أول حاجة الصبح 💧',
    'اتكلم مع حد بتحبه ❤️',
    'امشي نص ساعة على الأقل 🚶',
    'اقرا 5 صفحات من كتاب 📚',
    'صلي على النبي ﷺ 🌙',
    'ابتسم في وش حد مكسور 🌸',
];

const dontList = [
    'متخدش قرار مصيري النهاردة 🚫',
    'متجادلش حد في الرأي 🚫',
    'متسيبش نفسك للتوتر 🚫',
    'متنامش متأخر 😴',
    'متشتريش حاجة غالية 🚫',
    'متكلمش حد وانت متنرفز 🚫',
];

const colors = [
    { name: 'أحمر', emoji: '🔴', meaning: 'طاقة وشغف' },
    { name: 'أزرق', emoji: '🔵', meaning: 'هدوء وتفكير' },
    { name: 'أخضر', emoji: '🟢', meaning: 'نمو وخير' },
    { name: 'أصفر', emoji: '🟡', meaning: 'فرح وإبداع' },
    { name: 'بنفسجي', emoji: '🟣', meaning: 'غموض وذكاء' },
    { name: 'أسود', emoji: '⚫', meaning: 'قوة وهيبة' },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

module.exports = {
    name: 'حظ',
    aliases: ['luck', 'حظي', 'fortune'],
    desc: 'حظك اليوم بالتفصيل',
    async run(ctx) {
        const percent = Math.floor(Math.random() * 100) + 1;
        const advice = pick(advices);
        const doToday = pick(doList);
        const dontToday = pick(dontList);
        const color = pick(colors);
        const luckyNumber = Math.floor(Math.random() * 99) + 1;
        const time = pick(['الصبح 🌅', 'الضهر ☀️', 'العصر 🌤️', 'بالليل 🌙']);

        const filled = Math.floor(percent / 10);
        const bar = '▰'.repeat(filled) + '▱'.repeat(10 - filled);

        let emoji = '😶', level = 'عادي';
        if (percent >= 80) { emoji = '🔥'; level = 'ممتاز'; }
        else if (percent >= 60) { emoji = '😎'; level = 'جيد جداً'; }
        else if (percent >= 40) { emoji = '🙂'; level = 'جيد'; }
        else if (percent >= 20) { emoji = '😐'; level = 'متوسط'; }
        else { emoji = '😔'; level = 'ضعيف'; }

        await ctx.card(`حظك اليوم ${emoji}`, [
            { emoji, title: `التقييم: ${level}`, content: `        ${bar}\n        ${percent}%` },
            { emoji: '💭', title: 'نصيحة اليوم', content: advice },
            { emoji: '✅', title: 'اعمل النهاردة', content: doToday },
            { emoji: '❌', title: 'متـعملش', content: dontToday },
            { emoji: color.emoji, title: 'لونك', content: ` ${color.name} — ${color.meaning}` },
            { emoji: '🔢', title: 'رقم حظك', content: ` ${luckyNumber}` },
            { emoji: '🕒', title: 'وقت سعدك', content: ` ${time}` },
        ]);
    }
};
