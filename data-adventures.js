const ADVENTURES = [
    {
        id: 'a_forest', emoji: '🌲', name: 'الغابة المظلمة', minLevel: 1, minKingdomLevel: 1,
        danger: 1,
        steps: [
            { text: 'تجد صندوقاً خشبياً مغلقاً.', choices: [
                { text: 'افتحه', effect: { coins: [30,80], items: [['wood', 5]], xp: 20 }, chance: 0.75 },
                { text: 'اتركه', effect: { coins: [5,15], xp: 5 } },
            ]},
            { text: 'تلتقي بذئب ضخم.', choices: [
                { text: 'حارب', effect: { coins: [40,120], xp: 40 }, require: { army: 5 }, fail: { loseArmy: 3, xp: 10 }, chance: 0.6 },
                { text: 'اهرب', effect: { coins: [0,10], xp: 5 } },
            ]},
        ],
    },
    {
        id: 'a_mountain', emoji: '⛰️', name: 'قمة الجبل', minLevel: 3, minKingdomLevel: 2,
        danger: 2,
        steps: [
            { text: 'تصل إلى كهف غامض.', choices: [
                { text: 'ادخل', effect: { coins: [60,150], items: [['iron', 10]], xp: 40 }, chance: 0.7 },
                { text: 'تجاوزه', effect: { coins: [10,30], xp: 10 } },
            ]},
        ],
    },
    {
        id: 'a_ruins', emoji: '🏚️', name: 'الأطلال القديمة', minLevel: 8, minKingdomLevel: 5,
        danger: 4,
        steps: [
            { text: 'قلعة مهجورة أمامك. طرقان:', choices: [
                { text: 'دخول القلعة', effect: { coins: [200,500], xp: 100 }, chance: 0.5, fail: { loseArmy: 5, xp: 30 } },
                { text: 'المرور بالغابة', effect: { coins: [80,150], xp: 50 } },
            ]},
            { text: 'بداخل القلعة صندوق ذهبي.', choices: [
                { text: 'افتحه', effect: { coins: [500,1500], items: [['gold', 20]], xp: 200 }, chance: 0.4 },
                { text: 'خذ الصندوق واهرب', effect: { coins: [200,600], xp: 100 } },
            ]},
        ],
    },
];

function getAdventure(id) { return ADVENTURES.find(a => a.id === id); }
function getAllAdventures() { return ADVENTURES; }

module.exports = { ADVENTURES, getAdventure, getAllAdventures };
