/**
 * 👻 PHANTOM — 100+ مهمة مترابطة
 * الشكل: [id, name, type, difficulty, requires[], condition, target, reward, unlocks[]]
 * condition: { k: kind, ...args }
 */

const DIFF = {
    easy:    { emoji: '⚪', name: 'سهلة',    mult: 1 },
    normal:  { emoji: '🟢', name: 'عادية',   mult: 1.5 },
    medium:  { emoji: '🔵', name: 'متوسطة',  mult: 2 },
    hard:    { emoji: '🟣', name: 'صعبة',    mult: 3 },
    epic:    { emoji: '🟠', name: 'ملحمية',  mult: 5 },
    mythic:  { emoji: '🔴', name: 'أسطورية', mult: 10 },
};

const TYPES = {
    main:      { emoji: '🎯', name: 'رئيسية' },
    economy:   { emoji: '💰', name: 'اقتصادية' },
    resource:  { emoji: '⛏️', name: 'موارد' },
    kingdom:   { emoji: '🏰', name: 'مملكة' },
    military:  { emoji: '⚔️', name: 'عسكرية' },
    trade:     { emoji: '🛒', name: 'تجارة' },
    inventory: { emoji: '🎒', name: 'حقيبة' },
    upgrade:   { emoji: '📈', name: 'تطوير' },
    alliance:  { emoji: '🤝', name: 'تحالفات' },
    explore:   { emoji: '🗺️', name: 'استكشاف' },
    adventure: { emoji: '🔥', name: 'مغامرات' },
    endgame:   { emoji: '🏆', name: 'نهاية اللعبة' },
};

function M(id, name, type, diff, requires, cond, target, rewards, unlocks = []) {
    return { id, name, type, difficulty: diff, requires, condition: cond, target, rewards, unlocks };
}

const MISSIONS = [
    // ═══════════════════════════════════════════
    // 🎯 السلسلة الرئيسية (25)
    // ═══════════════════════════════════════════
    M(1,  'بداية الرحلة',        'main', 'easy',   [], [], { k: 'always' }, 1,  { coins: 50, xp: 20 }, [2]),
    M(2,  'اعرف نفسك',            'main', 'easy',   [1], [], { k: 'has_name' }, 1, { coins: 30, xp: 15 }, [3]),
    M(3,  'ابنِ إمبراطوريتك',     'main', 'easy',   [2], [], { k: 'has_kingdom' }, 1, { coins: 100, xp: 50 }, [4, 11]),
    M(4,  'أساس البناء',          'main', 'easy',   [3], [], { k: 'buildings_count' }, 1, { coins: 80, xp: 30 }, [5]),
    M(5,  'أرض الخير',            'main', 'normal', [4], [], { k: 'building_type', type: 'مزرعة' }, 1, { coins: 100, xp: 40, resources: { food: 200 } }, [6]),
    M(6,  'خامات الأرض',          'main', 'normal', [5], [], { k: 'building_type', type: 'منجم' }, 1, { coins: 120, xp: 50 }, [7]),
    M(7,  'حماية الأرض',          'main', 'normal', [6], [], { k: 'building_type', type: 'سور' }, 1, { coins: 150, xp: 60 }, [8]),
    M(8,  'قوة الجيش',            'main', 'normal', [7], [], { k: 'building_type', type: 'ثكنة' }, 1, { coins: 150, xp: 60 }, [9]),
    M(9,  'أول جنودك',            'main', 'normal', [8], [], { k: 'army_count' }, 5, { coins: 200, xp: 80 }, [10]),
    M(10, 'تاجر ماهر',            'main', 'normal', [9], [], { k: 'market_buys' }, 1, { coins: 100, xp: 50 }, [21]),
    // فرع عسكري
    M(11, 'جيشك الصغير',          'military', 'easy',   [3], [], { k: 'army_count' }, 1, { coins: 60, xp: 25 }, [12]),
    M(12, 'فرقة قتال',            'military', 'normal', [11], [], { k: 'army_count' }, 20, { coins: 200, xp: 80 }, [13]),
    M(13, 'جيش كبير',             'military', 'medium', [12], [], { k: 'army_count' }, 100, { coins: 500, xp: 200 }, [14]),
    M(14, 'جيش جبار',             'military', 'hard',   [13], [], { k: 'army_count' }, 500, { coins: 2000, xp: 800 }, [15, 62]),
    M(15, 'جيش أسطوري',           'military', 'epic',   [14], [], { k: 'army_count' }, 2000, { coins: 10000, xp: 5000 }, [16]),
    M(16, 'إمبراطور عسكري',       'military', 'mythic', [15], [], { k: 'army_count' }, 10000, { coins: 50000, xp: 20000 }, [66]),
    // فرع تطوير الجيش
    M(17, 'أول تدريب',            'military', 'easy',   [9], [], { k: 'train_count' }, 1, { coins: 80, xp: 40 }, [18]),
    M(18, 'محارب متمرس',          'military', 'normal', [17], [], { k: 'train_count' }, 10, { coins: 300, xp: 120 }, [19]),
    M(19, 'قائد محترف',           'military', 'hard',   [18], [], { k: 'train_count' }, 50, { coins: 2000, xp: 800 }, [20]),
    M(20, 'أسطورة التدريب',       'military', 'epic',   [19], [], { k: 'train_count' }, 200, { coins: 8000, xp: 3000 }, [66]),
    // 🛒 السوق والتجارة
    M(21, 'أول عملية شراء',       'trade', 'easy',   [10], [], { k: 'market_buys' }, 1, { coins: 50, xp: 20 }, [22]),
    M(22, 'مشتري ماهر',           'trade', 'normal', [21], [], { k: 'market_buys' }, 5, { coins: 200, xp: 80 }, [23]),
    M(23, 'تاجر كبير',            'trade', 'medium', [22], [], { k: 'market_buys' }, 20, { coins: 800, xp: 300 }, [24]),
    M(24, 'تاجر محترف',           'trade', 'hard',   [23], [], { k: 'market_buys' }, 50, { coins: 3000, xp: 1000 }, [25]),
    M(25, 'امبراطور التجارة',     'trade', 'epic',   [24], [], { k: 'market_buys' }, 200, { coins: 15000, xp: 5000 }, [66]),

    // ═══════════════════════════════════════════
    // 💰 الاقتصاد (15)
    // ═══════════════════════════════════════════
    M(26, 'أول عمل',              'economy', 'easy',   [], [], { k: 'work_count' }, 1, { coins: 30, xp: 15 }, [27]),
    M(27, 'عامل مجتهد',           'economy', 'normal', [], [], { k: 'work_count' }, 10, { coins: 150, xp: 60 }, [28]),
    M(28, 'أول راتب يومي',        'economy', 'easy',   [], [], { k: 'daily_count' }, 1, { coins: 20, xp: 10 }, [29]),
    M(29, 'ملتزم يومي',           'economy', 'normal', [], [], { k: 'daily_count' }, 7, { coins: 300, xp: 100 }, [30]),
    M(30, 'وفيّ',                 'economy', 'hard',   [], [], { k: 'daily_count' }, 30, { coins: 2000, xp: 800 }, [31]),
    M(31, 'رصيد أول',             'economy', 'easy',   [], [], { k: 'coins_amount' }, 500, { coins: 50, xp: 20 }, [32]),
    M(32, 'ثري صغير',             'economy', 'normal', [], [], { k: 'coins_amount' }, 5000, { coins: 500, xp: 200 }, [33]),
    M(33, 'مليونير',              'economy', 'hard',   [], [], { k: 'coins_amount' }, 100000, { coins: 10000, xp: 5000 }, [34]),
    M(34, 'إمبراطور الاقتصاد',    'economy', 'epic',   [], [], { k: 'coins_amount' }, 1000000, { coins: 100000, xp: 50000 }, [66]),
    M(35, 'أول تحويل',            'economy', 'easy',   [], [], { k: 'transfer_count' }, 1, { coins: 50, xp: 20 }, [36]),
    M(36, 'كريم',                 'economy', 'normal', [], [], { k: 'transfer_count' }, 10, { coins: 300, xp: 100 }, []),
    M(37, 'أول بيع',              'economy', 'easy',   [], [], { k: 'market_sells' }, 1, { coins: 50, xp: 20 }, [38]),
    M(38, 'بائع ماهر',            'economy', 'normal', [], [], { k: 'market_sells' }, 10, { coins: 400, xp: 150 }, [39]),
    M(39, 'تاجر محنك',            'economy', 'hard',   [], [], { k: 'market_sells' }, 50, { coins: 2500, xp: 1000 }, []),
    M(40, 'صافي أرباح',           'economy', 'medium', [], [], { k: 'coins_amount' }, 50000, { coins: 5000, xp: 2000 }, []),

    // ═══════════════════════════════════════════
    // ⛏️ موارد (10)
    // ═══════════════════════════════════════════
    M(41, 'خشب من الجمع',         'resource', 'easy',   [3], [], { k: 'res_wood_total' }, 100, { coins: 40, xp: 20 }, []),
    M(42, 'خشب كثير',             'resource', 'normal', [3], [], { k: 'res_wood_total' }, 1000, { coins: 300, xp: 100 }, []),
    M(43, 'غابة كاملة',           'resource', 'hard',   [3], [], { k: 'res_wood_total' }, 10000, { coins: 2000, xp: 800 }, []),
    M(44, 'حجر الجبل',            'resource', 'easy',   [3], [], { k: 'res_stone_total' }, 100, { coins: 40, xp: 20 }, []),
    M(45, 'جبل كامل',             'resource', 'normal', [3], [], { k: 'res_stone_total' }, 1000, { coins: 300, xp: 100 }, []),
    M(46, 'محجر ضخم',             'resource', 'hard',   [3], [], { k: 'res_stone_total' }, 10000, { coins: 2000, xp: 800 }, []),
    M(47, 'معدن الحديد',          'resource', 'normal', [3], [], { k: 'res_iron_total' }, 500, { coins: 400, xp: 150 }, []),
    M(48, 'حداد محترف',           'resource', 'hard',   [3], [], { k: 'res_iron_total' }, 5000, { coins: 3000, xp: 1200 }, []),
    M(49, 'كنوز الذهب',           'resource', 'medium', [3], [], { k: 'res_gold_total' }, 1000, { coins: 500, xp: 200 }, []),
    M(50, 'خزينة الملك',          'resource', 'epic',   [3], [], { k: 'res_gold_total' }, 50000, { coins: 10000, xp: 5000 }, []),

    // ═══════════════════════════════════════════
    // 🏰 مملكة (15)
    // ═══════════════════════════════════════════
    M(51, 'مملكة صغيرة',          'kingdom', 'easy',   [3], [], { k: 'kingdom_level' }, 2, { coins: 80, xp: 30 }, [52]),
    M(52, 'مملكة متوسطة',         'kingdom', 'normal', [51], [], { k: 'kingdom_level' }, 5, { coins: 300, xp: 150 }, [53]),
    M(53, 'مملكة كبيرة',          'kingdom', 'medium', [52], [], { k: 'kingdom_level' }, 10, { coins: 1000, xp: 400 }, [54]),
    M(54, 'مملكة عظيمة',          'kingdom', 'hard',   [53], [], { k: 'kingdom_level' }, 25, { coins: 5000, xp: 2000 }, [55]),
    M(55, 'مملكة أسطورية',        'kingdom', 'epic',   [54], [], { k: 'kingdom_level' }, 50, { coins: 20000, xp: 10000 }, [66]),
    M(56, 'مباني كثيرة',          'kingdom', 'normal', [3], [], { k: 'buildings_count' }, 10, { coins: 400, xp: 150 }, [57]),
    M(57, 'مدينة كاملة',          'kingdom', 'medium', [56], [], { k: 'buildings_count' }, 30, { coins: 1500, xp: 600 }, [58]),
    M(58, 'إمبراطورية المباني',   'kingdom', 'hard',   [57], [], { k: 'buildings_count' }, 100, { coins: 8000, xp: 3000 }, [59]),
    M(59, 'مدينة أسطورية',        'kingdom', 'epic',   [58], [], { k: 'buildings_count' }, 500, { coins: 30000, xp: 15000 }, [66]),
    M(60, 'ثكنات متعددة',         'kingdom', 'normal', [8], [], { k: 'building_type_count', type: 'ثكنة', count: 5 }, 5, { coins: 500, xp: 200 }, []),
    M(61, 'أسوار حصينة',          'kingdom', 'medium', [7], [], { k: 'building_type_count', type: 'سور', count: 10 }, 10, { coins: 1500, xp: 600 }, []),
    M(62, 'مزارع كثيرة',          'kingdom', 'normal', [5], [], { k: 'building_type_count', type: 'مزرعة', count: 10 }, 10, { coins: 800, xp: 300 }, []),
    M(63, 'مناجم غنية',           'kingdom', 'normal', [6], [], { k: 'building_type_count', type: 'منجم', count: 10 }, 10, { coins: 800, xp: 300 }, []),
    M(64, 'قوة المملكة',          'kingdom', 'hard',   [55], [], { k: 'kingdom_power' }, 50000, { coins: 5000, xp: 2500 }, [65]),
    M(65, 'قوة أسطورية',          'kingdom', 'epic',   [64], [], { k: 'kingdom_power' }, 500000, { coins: 30000, xp: 15000 }, [66]),

    // ═══════════════════════════════════════════
    // 🤝 الدبلوماسية (10)
    // ═══════════════════════════════════════════
    M(66, 'أول تحالف',            'alliance', 'easy',   [], [], { k: 'alliances_count' }, 1, { coins: 200, xp: 100 }, [67]),
    M(67, 'شبكة تحالفات',         'alliance', 'normal', [], [], { k: 'alliances_count' }, 3, { coins: 800, xp: 400 }, [68]),
    M(68, 'ملك التحالفات',        'alliance', 'hard',   [], [], { k: 'alliances_count' }, 5, { coins: 3000, xp: 1500 }, []),
    M(69, 'أول تحدٍ',             'alliance', 'easy',   [], [], { k: 'challenges_count' }, 1, { coins: 100, xp: 50 }, [70]),
    M(70, 'متحدٍ محترف',          'alliance', 'normal', [], [], { k: 'challenges_count' }, 5, { coins: 500, xp: 200 }, []),
    M(71, 'أول حرب',              'alliance', 'medium', [], [], { k: 'wars_count' }, 1, { coins: 300, xp: 150 }, [72]),
    M(72, 'محارب حقيقي',          'alliance', 'hard',   [], [], { k: 'wars_count' }, 10, { coins: 2000, xp: 1000 }, [73]),
    M(73, 'قائد حروب',            'alliance', 'epic',   [], [], { k: 'wars_count' }, 50, { coins: 10000, xp: 5000 }, []),
    M(74, 'عدو لدود',             'alliance', 'medium', [], [], { k: 'attack_count' }, 5, { coins: 500, xp: 250 }, [75]),
    M(75, 'فاتح عظيم',            'alliance', 'hard',   [], [], { k: 'attack_count' }, 20, { coins: 3000, xp: 1500 }, []),

    // ═══════════════════════════════════════════
    // 🎒 الحقيبة (10)
    // ═══════════════════════════════════════════
    M(76, 'أول عنصر',             'inventory', 'easy',   [], [], { k: 'inventory_items' }, 1, { coins: 30, xp: 15 }, [77]),
    M(77, 'حقيبة صغيرة',          'inventory', 'normal', [], [], { k: 'inventory_items' }, 5, { coins: 150, xp: 60 }, [78]),
    M(78, 'حقيبة كبيرة',          'inventory', 'medium', [], [], { k: 'inventory_items' }, 20, { coins: 500, xp: 250 }, [79]),
    M(79, 'كنز حقيقي',            'inventory', 'hard',   [], [], { k: 'inventory_items' }, 100, { coins: 3000, xp: 1500 }, [80]),
    M(80, 'حقيبة أسطورية',        'inventory', 'epic',   [], [], { k: 'inventory_items' }, 500, { coins: 15000, xp: 8000 }, []),
    M(81, 'أنواع كثيرة',          'inventory', 'normal', [], [], { k: 'inventory_types' }, 5, { coins: 200, xp: 100 }, [82]),
    M(82, 'جامع العناصر',         'inventory', 'hard',   [], [], { k: 'inventory_types' }, 20, { coins: 2000, xp: 1000 }, []),
    M(83, 'عنصر نادر',            'inventory', 'medium', [], [], { k: 'has_rare_item' }, 1, { coins: 500, xp: 250 }, [84]),
    M(84, 'عدة نادرة',            'inventory', 'hard',   [], [], { k: 'has_rare_item' }, 5, { coins: 3000, xp: 1500 }, []),
    M(85, 'فئة خاصة',             'inventory', 'mythic', [], [], { k: 'has_special_item' }, 1, { coins: 30000, xp: 20000 }, [86]),
    M(86, 'كل الفئة الخاصة',      'inventory', 'mythic', [85], [], { k: 'has_special_item' }, 5, { coins: 100000, xp: 50000 }, [87]),
    M(87, '👑 ملك PHANTOM 👑',    'endgame',   'mythic', [86], [], { k: 'has_sword_dev' }, 1, { coins: 500000, xp: 200000 }, []),

    // ═══════════════════════════════════════════
    // 🗺️ الاستكشاف (10)
    // ═══════════════════════════════════════════
    M(88, 'أول استكشاف',          'explore', 'easy',   [], [], { k: 'explorations_count' }, 1, { coins: 50, xp: 30 }, [89]),
    M(89, 'مستكشف مبتدئ',         'explore', 'normal', [], [], { k: 'explorations_count' }, 10, { coins: 300, xp: 150 }, [90]),
    M(90, 'مستكشف ماهر',          'explore', 'medium', [], [], { k: 'explorations_count' }, 50, { coins: 1500, xp: 700 }, [91]),
    M(91, 'مستكشف محترف',         'explore', 'hard',   [], [], { k: 'explorations_count' }, 200, { coins: 8000, xp: 4000 }, [92]),
    M(92, 'مستكشف أسطوري',        'explore', 'epic',   [], [], { k: 'explorations_count' }, 1000, { coins: 50000, xp: 25000 }, []),
    M(93, 'الغابة',               'explore', 'easy',   [], [], { k: 'explore_area', area: 'forest' }, 1, { coins: 100, xp: 50 }, []),
    M(94, 'الجبال',               'explore', 'normal', [], [], { k: 'explore_area', area: 'mountains' }, 1, { coins: 300, xp: 150 }, []),
    M(95, 'الصحراء',              'explore', 'medium', [], [], { k: 'explore_area', area: 'desert' }, 1, { coins: 500, xp: 250 }, []),
    M(96, 'الأراضي الجليدية',     'explore', 'hard',   [], [], { k: 'explore_area', area: 'ice' }, 1, { coins: 2000, xp: 1000 }, []),
    M(97, 'المنطقة البركانية',    'explore', 'epic',   [], [], { k: 'explore_area', area: 'volcano' }, 1, { coins: 8000, xp: 4000 }, []),

    // ═══════════════════════════════════════════
    // 🔥 المغامرات (8)
    // ═══════════════════════════════════════════
    M(98,  'أول مغامرة',          'adventure', 'easy',   [], [], { k: 'adventures_count' }, 1, { coins: 100, xp: 50 }, [99]),
    M(99,  'مغامر شجاع',          'adventure', 'normal', [], [], { k: 'adventures_count' }, 10, { coins: 500, xp: 250 }, [100]),
    M(100, 'مغامر خبير',          'adventure', 'medium', [], [], { k: 'adventures_count' }, 50, { coins: 2500, xp: 1200 }, [101]),
    M(101, 'مغامر محترف',         'adventure', 'hard',   [], [], { k: 'adventures_count' }, 200, { coins: 10000, xp: 5000 }, [102]),
    M(102, 'مغامر أسطوري',        'adventure', 'epic',   [], [], { k: 'adventures_count' }, 1000, { coins: 60000, xp: 30000 }, []),
    M(103, 'منتصر المغامرات',     'adventure', 'medium', [], [], { k: 'adventures_won' }, 20, { coins: 1500, xp: 800 }, []),
    M(104, 'بطل المغامرات',       'adventure', 'hard',   [], [], { k: 'adventures_won' }, 100, { coins: 6000, xp: 3000 }, []),
    M(105, 'أسطورة المغامرات',    'adventure', 'epic',   [], [], { k: 'adventures_won' }, 500, { coins: 30000, xp: 15000 }, []),

    // ═══════════════════════════════════════════
    // 🏆 المهام المتقدمة/النهاية (10)
    // ═══════════════════════════════════════════
    M(106, 'إنجاز كل المهام الأساسية', 'endgame', 'mythic', [66], [], { k: 'completed_count' }, 50, { coins: 100000, xp: 50000 }, [107]),
    M(107, 'أسطورة PHANTOM',      'endgame', 'mythic', [106], [], { k: 'completed_count' }, 80, { coins: 200000, xp: 100000 }, [108]),
    M(108, 'سيد الظلال',          'endgame', 'mythic', [107], [], { k: 'completed_count' }, 100, { coins: 500000, xp: 250000 }, []),
    M(109, 'كنز أسطوري',          'endgame', 'mythic', [66], [], { k: 'coins_amount' }, 10000000, { coins: 1000000, xp: 500000 }, []),
    M(110, 'محارب لا يُهزم',      'endgame', 'mythic', [15], [], { k: 'wins_count' }, 100, { coins: 300000, xp: 150000 }, []),
];

const MISSION_MAP = new Map();
for (const m of MISSIONS) MISSION_MAP.set(m.id, m);

// فهارس للمساعدة
const BY_PREV = new Map(); // من id → المهام اللي بتفتحه
for (const m of MISSIONS) {
    for (const p of m.requires) {
        if (!BY_PREV.has(p)) BY_PREV.set(p, []);
        BY_PREV.get(p).push(m.id);
    }
}

function getMission(id) { return MISSION_MAP.get(id) || null; }
function getAllMissions() { return MISSIONS; }
function getUnlockedBy(id) { return BY_PREV.get(id) || []; }

module.exports = { DIFF, TYPES, MISSIONS, MISSION_MAP, getMission, getAllMissions, getUnlockedBy };
