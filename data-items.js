/**
 * 👻 PHANTOM — كتالوج السوق (120 عنصر + فوايد)
 */

const RARITIES = {
    common:    { key: 'common',    emoji: '⚪', name: 'عادي',         weight: 40,  sellRate: 0.60 },
    uncommon:  { key: 'uncommon',  emoji: '🟢', name: 'غير شائع',     weight: 25,  sellRate: 0.65 },
    rare:      { key: 'rare',      emoji: '🔵', name: 'نادر',          weight: 15,  sellRate: 0.70 },
    epic:      { key: 'epic',      emoji: '🟣', name: 'ملحمي',        weight: 10,  sellRate: 0.70 },
    legendary: { key: 'legendary', emoji: '🟠', name: 'أسطوري',       weight: 7,   sellRate: 0.75 },
    mythic:    { key: 'mythic',    emoji: '🔴', name: 'نادر جدًا',    weight: 2.5, sellRate: 0.75 },
    special:   { key: 'special',   emoji: '👑✨', name: 'فئة خاصة',   weight: 0.5, sellRate: 0.80 },
};

/**
 * bonuses keys:
 *   prodFood/prodWood/prodStone/prodIron/prodGold  → إنتاج/ساعة +X
 *   attack / defense                                → إضافة للقوة
 *   speed                                           → سرعة (تقلل cooldowns)
 *   energy                                          → طاقة (تزيد الإنتاج الكلي)
 *   growth                                          → نمو (تقلل تكلفة التطوير)
 *   buildSpeed                                      → تسريع البناء
 *   lootBonus                                       → زيادة غنائم الحرب
 *   maxArmy                                         → زيادة سقف الجيش
 */

const ITEMS = [
    // ═══ موارد (15) — فوايد: إنتاج مباشر عند استخدامها كـ boost
    ['wood',       '🪵', 'خشب',              'resource', 'common',    8,   'مورد أساسي للبناء', { prodWood: 2 }],
    ['stone',      '🪨', 'حجر',              'resource', 'common',    10,  'مورد أساسي للبناء', { prodStone: 2 }],
    ['food',       '🌾', 'طعام',             'resource', 'common',    12,  'يغذي الجيش', { prodFood: 2 }],
    ['sand',       '⏳', 'رمل',              'resource', 'common',    5,   'مورد شائع', { buildSpeed: 1 }],
    ['clay',       '🧱', 'طين',              'resource', 'common',    6,   'للصناعة', { buildSpeed: 1 }],
    ['salt',       '🧂', 'ملح',              'resource', 'common',    7,   'مورد تجاري', { prodFood: 1 }],
    ['copper',     '🟤', 'نحاس',             'resource', 'common',    15,  'معدن شائع', { prodIron: 1 }],
    ['iron',       '⛓️', 'حديد',             'resource', 'uncommon',  25,  'معدن للبناء والسلاح', { prodIron: 4 }],
    ['bone',       '🦴', 'عظام',             'resource', 'uncommon',  28,  'مادة حرفية', { attack: 2 }],
    ['coal',       '⚫', 'فحم',              'resource', 'uncommon',  30,  'وقود وحدادة', { buildSpeed: 3 }],
    ['leather',    '🟫', 'جلد',              'resource', 'uncommon',  35,  'لدروع خفيفة', { defense: 3 }],
    ['silver',     '⚪', 'فضة',              'resource', 'uncommon',  40,  'معدن ثمين', { prodGold: 2 }],
    ['gold',       '🪙', 'ذهب',              'resource', 'rare',      80,  'معدن نادر', { prodGold: 5 }],
    ['ruby',       '🔴', 'ياقوت',            'resource', 'rare',      150, 'جوهرة نادرة', { energy: 2 }],
    ['emerald',    '🟢', 'زمرد',             'resource', 'epic',      400, 'جوهرة ملحمية', { energy: 5, growth: 2 }],

    // ═══ أدوات (15) — تسريع وإنتاج
    ['shovel',     '🪏', 'مجرفة',            'tool', 'common',    20,  'أداة حفر', { buildSpeed: 2 }],
    ['saw',        '🪚', 'منشار',            'tool', 'common',    25,  'قطع الأخشاب', { prodWood: 3 }],
    ['rope',       '🪢', 'حبل',              'tool', 'common',    30,  'أداة متعددة', { buildSpeed: 2 }],
    ['lamp',       '💡', 'مصباح',            'tool', 'uncommon',  40,  'إنارة', { energy: 1 }],
    ['net',        '🥅', 'شبكة صيد',         'tool', 'uncommon',  40,  'للصيد', { prodFood: 4 }],
    ['hammer',     '🔨', 'مطرقة',            'tool', 'uncommon',  45,  'للحدادة', { buildSpeed: 5, prodIron: 2 }],
    ['rod',        '🎣', 'صنارة',            'tool', 'uncommon',  45,  'لصيد السمك', { prodFood: 5 }],
    ['axe',        '🪓', 'فأس حديدي',        'tool', 'uncommon',  50,  'لقطع الأخشاب', { prodWood: 6 }],
    ['pickaxe',    '⛏️', 'معول',             'tool', 'uncommon',  55,  'للتعدين', { prodStone: 5, prodIron: 2 }],
    ['plow',       '🚜', 'محراث',            'tool', 'uncommon',  60,  'للزراعة', { prodFood: 8 }],
    ['compass',    '🧭', 'بوصلة',            'tool', 'rare',      90,  'للتنقل', { speed: 2 }],
    ['knife',      '🔪', 'سكين',             'tool', 'rare',      100, 'للقتال أو الطبخ', { attack: 5 }],
    ['key',        '🗝️', 'مفتاح',            'tool', 'rare',      120, 'للفتح', { lootBonus: 3 }],
    ['trap',       '🪤', 'فخ',               'tool', 'epic',      500, 'لصيد الوحوش', { attack: 15, lootBonus: 5 }],
    ['megaphone',  '📢', 'مكبر صوت',         'tool', 'rare',      130, 'للإعلانات', { growth: 3 }],

    // ═══ أسلحة (20) — هجوم
    ['w_wood',     '🗡️', 'سيف خشبي',         'weapon', 'common',    15,  'سلاح مبتدئ', { attack: 3 }],
    ['club',       '🏏', 'هراوة',            'weapon', 'common',    18,  'سلاح بسيط', { attack: 4 }],
    ['dagger',     '🗡️', 'خنجر',            'weapon', 'common',    20,  'سلاح خفيف', { attack: 5, speed: 1 }],
    ['bow_s',      '🏹', 'قوس قصير',         'weapon', 'common',    25,  'قوس مبتدئ', { attack: 5 }],
    ['spear',      '🔱', 'رمح',              'weapon', 'uncommon',  60,  'سلاح متوسط', { attack: 12 }],
    ['bow_l',      '🏹', 'قوس طويل',         'weapon', 'uncommon',  70,  'مدى بعيد', { attack: 14 }],
    ['bronze_sw',  '⚔️', 'سيف برونزي',       'weapon', 'uncommon',  80,  'سيف متوازن', { attack: 16, defense: 3 }],
    ['axe_war',    '🪓', 'فأس قتال',         'weapon', 'uncommon',  90,  'قوة هجوم', { attack: 18 }],
    ['spear_l',    '🔱', 'رمح طويل',         'weapon', 'rare',      180, 'مدى أطول', { attack: 30 }],
    ['iron_sw',    '⚔️', 'سيف حديدي',        'weapon', 'rare',      200, 'سيف قوي', { attack: 35, defense: 5 }],
    ['silver_sw',  '⚔️', 'سيف فضي',          'weapon', 'rare',      220, 'ضد الأشرار', { attack: 40 }],
    ['long_sw',    '⚔️', 'سيف طويل',         'weapon', 'rare',      230, 'مدى طويل', { attack: 42 }],
    ['bow_c',      '🏹', 'قوس مركب',         'weapon', 'rare',      220, 'دقة عالية', { attack: 38, speed: 3 }],
    ['diamond_sw', '💎', 'سيف ماسي',         'weapon', 'rare',      250, 'صلابة عالية', { attack: 45 }],
    ['dual_sw',    '⚔️', 'سيفان',            'weapon', 'rare',      300, 'هجوم مزدوج', { attack: 55, speed: 5 }],
    ['hammer_war', '🔨', 'مطرقة حرب',        'weapon', 'epic',      550, 'صدمة قوية', { attack: 100, defense: 10 }],
    ['poison_dg',  '🗡️', 'خنجر مسموم',       'weapon', 'epic',      600, 'يسمم العدو', { attack: 110, speed: 10 }],
    ['steel_sw',   '⚔️', 'سيف فولاذي',       'weapon', 'epic',      700, 'قوي جدًا', { attack: 130 }],
    ['fire_sw',    '🔥', 'سيف ناري',         'weapon', 'legendary', 2000, 'يحرق الأعداء', { attack: 280, energy: 10 }],
    ['shadow_sw',  '🌑', 'سيف الظل',         'weapon', 'mythic',    3800, 'سلاح أسطوري', { attack: 500, speed: 30, lootBonus: 15 }],

    // ═══ دروع (15) — دفاع
    ['l_glove',    '🧤', 'قفازات جلدية',     'armor', 'common',    20,  'حماية خفيفة', { defense: 3 }],
    ['l_armor',    '🥋', 'درع جلدي',         'armor', 'common',    25,  'حماية أساسية', { defense: 5 }],
    ['l_boot',     '👢', 'حذاء جلدي',        'armor', 'common',    30,  'حركة مرنة', { speed: 1, defense: 2 }],
    ['f_glove',    '🧤', 'قفازات فولاذ',     'armor', 'uncommon',  80,  'حماية قوية', { defense: 12 }],
    ['helm_i',     '⛑️', 'خوذة حديدية',      'armor', 'uncommon',  60,  'رأس محمي', { defense: 10 }],
    ['bronze_ar',  '🛡️', 'درع برونزي',       'armor', 'uncommon',  70,  'درع متوسط', { defense: 14 }],
    ['f_boot',     '👢', 'حذاء ريش',         'armor', 'rare',      90,  'سرعة متزايدة', { speed: 5, defense: 5 }],
    ['iron_ar',    '🛡️', 'درع حديدي',        'armor', 'rare',      180, 'حماية عالية', { defense: 35 }],
    ['silver_ar',  '🛡️', 'درع فضي',          'armor', 'rare',      200, 'ضد السحر', { defense: 40, energy: 2 }],
    ['helm_s',     '⛑️', 'خوذة فولاذية',      'armor', 'rare',      220, 'رأس مدرّع', { defense: 45 }],
    ['diamond_ar', '💎', 'درع ماسي',         'armor', 'rare',      240, 'صلابة قصوى', { defense: 50 }],
    ['steel_ar',   '🛡️', 'درع فولاذي',       'armor', 'epic',      650, 'حماية أسطورية', { defense: 120 }],
    ['gold_ar',    '🛡️', 'درع ذهبي',         'armor', 'legendary', 2200, 'درع ملكي', { defense: 250, energy: 8 }],
    ['dragon_h',   '🐲', 'خوذة التنين',      'armor', 'legendary', 2500, 'نار مقاومة', { defense: 280, energy: 10 }],
    ['shadow_cl',  '🌑', 'عباءة الظل',       'armor', 'mythic',    3500, 'تخفٍ كامل', { defense: 450, speed: 40 }],

    // ═══ مواد تطوير (15) — growth + buildSpeed
    ['polish',     '💠', 'حجر صقل',          'material', 'common',    15,  'لصقل الأسلحة', { buildSpeed: 2 }],
    ['powder',     '✨', 'مسحوق سحري',       'material', 'uncommon',  35,  'للتطوير', { growth: 2 }],
    ['iron_p',     '⚙️', 'برادة فولاذ',      'material', 'uncommon',  40,  'مادة تكرير', { buildSpeed: 4 }],
    ['herb',       '🌿', 'عشبة نادرة',       'material', 'uncommon',  45,  'للجرعات', { energy: 2 }],
    ['oil_h',      '🫗', 'زيت مقدس',         'material', 'uncommon',  70,  'لتطوير الأسلحة', { attack: 3, growth: 1 }],
    ['salt_a',     '⚗️', 'ملح الكيمياء',     'material', 'rare',      110, 'مادة طبية', { energy: 3 }],
    ['gold_t',     '🧵', 'خيط الذهب',        'material', 'rare',      130, 'حرفية فاخرة', { prodGold: 8 }],
    ['star_d',     '✨', 'غبار نجمي',        'material', 'rare',      160, 'مادة أسطورية', { growth: 5 }],
    ['sun_d',      '💧', 'قطرات الشمس',      'material', 'rare',      170, 'طاقة نقية', { energy: 6 }],
    ['heart_st',   '❤️', 'قلب الحجر',        'material', 'rare',      200, 'قوة الأرض', { defense: 20, prodStone: 10 }],
    ['metal_r',    '🔩', 'معدن نادر',        'material', 'epic',      450, 'سبيكة نادرة', { attack: 30, defense: 30 }],
    ['crystal_e',  '💠', 'بلورة طاقة',       'material', 'epic',      500, 'طاقة خالصة', { energy: 15 }],
    ['tree_s',     '🌳', 'روح الشجرة',       'material', 'epic',      520, 'مادة أسطورية', { prodWood: 40, prodFood: 20 }],
    ['dragon_g',   '🐉', 'صمغ التنين',       'material', 'epic',      600, 'مقاومة الحرارة', { defense: 60, energy: 8 }],
    ['gem_s',      '💎', 'جوهرة تعزيز',      'material', 'rare',      150, 'لتعزيز الممتلكات', { growth: 4, buildSpeed: 6 }],

    // ═══ عناصر نادرة (10) — فوايد شاملة
    ['ruby_h',     '❤️‍🔥', 'قلب النار',       'rare', 'legendary', 2800, 'طاقة نارية', { attack: 200, energy: 25 }],
    ['pearl_s',    '🦪', 'عرش بلقيس',        'rare', 'legendary', 3000, 'تحفة فنية', { growth: 20, prodGold: 50 }],
    ['eye_s',      '👁️', 'عين الأفعى',       'rare', 'mythic',    3400, 'رؤية مستقبلية', { lootBonus: 25, speed: 15 }],
    ['sea_g',      '🌊', 'جوهرة البحر',      'rare', 'mythic',    3600, 'قوة المحيط', { energy: 40, defense: 200 }],
    ['crown_k',    '👑', 'تاج الملك',        'rare', 'mythic',    3600, 'سلطة كاملة', { maxArmy: 100, growth: 25 }],
    ['ring_s',     '💍', 'خاتم سليمان',      'rare', 'mythic',    3700, 'يحكم الجن', { energy: 35, attack: 250 }],
    ['lamp_a',     '🪔', 'مصباح علاء الدين', 'rare', 'mythic',    3900, 'يحقق الأمنيات', { prodGold: 100, growth: 30 }],
    ['phil_s',     '🔮', 'حجر الفلاسفة',     'rare', 'mythic',    4000, 'تحويل المعادن', { prodGold: 150, prodIron: 50 }],
    ['sword_a',    '⚔️', 'سيف الملك آرثر',   'rare', 'mythic',    4100, 'سيف أسطوري', { attack: 600, defense: 300 }],
    ['staff_m',    '🪄', 'عصا موسى',         'rare', 'mythic',    4200, 'قوة إلهية', { energy: 60, attack: 400, defense: 200 }],

    // ═══ عناصر أسطورية (10)
    ['lamp_sp',    '🪔', 'فانوس الروح',      'legendary', 'legendary', 2000, 'يضيء الظلام', { energy: 15 }],
    ['fang_w',     '🐺', 'ناب الذئب الأسود', 'legendary', 'legendary', 2100, 'شراسة', { attack: 180, speed: 10 }],
    ['feather_g',  '🪶', 'ريشة الجريفون',    'legendary', 'legendary', 2200, 'طيران', { speed: 20 }],
    ['stone_d',    '💠', 'حجر التنين',       'legendary', 'legendary', 2200, 'قوة التنين', { attack: 150, defense: 150 }],
    ['scale_d',    '🐉', 'حراشف التنين',     'legendary', 'legendary', 2300, 'حماية أسطورية', { defense: 250 }],
    ['claw_t',     '🦾', 'مخلب العملاق',     'legendary', 'legendary', 2400, 'قوة جبارة', { attack: 220 }],
    ['horn_u',     '🦄', 'قرن وحيد القرن',   'legendary', 'legendary', 2400, 'شفاء قوي', { energy: 25 }],
    ['eye_d',      '👁️', 'عين التنين',       'legendary', 'legendary', 2500, 'رؤية ثاقبة', { lootBonus: 20 }],
    ['blood_p',    '🩸', 'دماء العنقاء',     'legendary', 'legendary', 2600, 'إحياء', { energy: 30, maxArmy: 50 }],
    ['egg_d',      '🥚', 'بيضة التنين',      'legendary', 'legendary', 2700, 'تنين صغير', { attack: 200, defense: 200, maxArmy: 30 }],

    // ═══ عناصر المملكة (15)
    ['banner',     '🚩', 'راية المملكة',     'kingdom', 'uncommon',  60,  'رمز المملكة', { growth: 2 }],
    ['heal_f',     '🌸', 'زهرة الشفاء',      'kingdom', 'uncommon',  45,  'تشفي الجرحى', { maxArmy: 10 }],
    ['stone_b',    '🧱', 'حجر البناء',       'kingdom', 'uncommon',  50,  'للإنشاءات', { buildSpeed: 8 }],
    ['key_f',      '🗝️', 'مفتاح الحصن',      'kingdom', 'uncommon',  80,  'للبوابات', { defense: 15 }],
    ['tent_k',     '⛺', 'خيمة الملك',       'kingdom', 'uncommon',  100, 'مخيم ملكي', { maxArmy: 20 }],
    ['scroll_a',   '📜', 'مخطوطة قديمة',     'kingdom', 'rare',      150, 'معرفة قديمة', { growth: 8 }],
    ['flag_al',    '🏳️', 'راية التحالف',     'kingdom', 'rare',      160, 'رمز التحالف', { growth: 6, defense: 20 }],
    ['statue_p',   '🗿', 'تمثال الحماية',    'kingdom', 'rare',      180, 'حامي المملكة', { defense: 50 }],
    ['armor_king', '🛡️', 'درع المملكة',      'kingdom', 'rare',      200, 'شعار المملكة', { defense: 60, maxArmy: 25 }],
    ['family_ar',  '🛡️', 'درع الأسرة',       'kingdom', 'rare',      210, 'حماية الأسرة', { defense: 55 }],
    ['sword_gu',   '⚔️', 'سيف الوصي',        'kingdom', 'rare',      240, 'سيف الحماية', { attack: 60, defense: 30 }],
    ['crown_l',    '👑', 'تاج القائد',       'kingdom', 'rare',      250, 'سلطة القائد', { maxArmy: 40, growth: 10 }],
    ['seed_r',     '🌱', 'بذرة الياقوت',     'kingdom', 'epic',      550, 'نمو نادر', { prodFood: 50, prodGold: 20, growth: 15 }],
    ['leader_sw',  '⚔️', 'سيف القائد',       'kingdom', 'mythic',    3700, 'سيف أسطوري', { attack: 800, defense: 400, maxArmy: 100 }],
    ['ring_k',     '💍', 'خاتم الملك',       'kingdom', 'special',   5500, 'خاتم السلطة العليا', { attack: 1000, defense: 1000, growth: 40, maxArmy: 150, energy: 50 }],

    // ═══ الفئة الخاصة (5) — الأندر
    ['bow_etern',  '👑✨', 'قوس الأبدية',    'special', 'special', 4500, 'قوس أسطوري لا يخطئ', { attack: 1500, speed: 80, energy: 60 }],
    ['shield_et',  '👑✨', 'الدرع الأبدي',   'special', 'special', 4800, 'حماية مطلقة', { defense: 2000, energy: 50 }],
    ['crown_c',    '👑✨', 'تاج الفاتح',     'special', 'special', 5000, 'تاج المنتصر', { attack: 1000, defense: 1000, growth: 60, maxArmy: 200 }],
    ['gem_eter',   '👑✨', 'جوهرة الخلود',   'special', 'special', 5200, 'حياة أبدية', { energy: 200, defense: 800, maxArmy: 100 }],
    // ═══ الأندر على الإطلاق — السيف المطوّر ═══
    ['sword_dev',  '👑✨⚔️', 'السيف المطوّر', 'special', 'special', 50000, 'أقوى سلاح في PHANTOM — لا يقهر', {
        attack: 10000, defense: 8000, speed: 500,
        energy: 500, growth: 200, maxArmy: 1000,
        prodFood: 500, prodWood: 500, prodStone: 500, prodIron: 500, prodGold: 500,
        lootBonus: 100, buildSpeed: 100,
    }],
];

const ITEM_MAP = new Map();
for (const it of ITEMS) {
    ITEM_MAP.set(it[0], {
        id: it[0], emoji: it[1], name: it[2], category: it[3], rarity: it[4],
        basePrice: it[5], desc: it[6], bonuses: it[7] || {},
    });
}

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'special'];
const SPECIAL_IDS = ['bow_etern', 'shield_et', 'crown_c', 'gem_eter', 'sword_dev'];
const SWORD_DEV_ID = 'sword_dev';
const SWORD_DEV_UNLOCK_PURCHASES = 5;
const MIN_PURCHASE_QTY = 10;

module.exports = {
    RARITIES, RARITY_ORDER, ITEMS, ITEM_MAP,
    SPECIAL_IDS, SWORD_DEV_ID, SWORD_DEV_UNLOCK_PURCHASES, MIN_PURCHASE_QTY,
};
