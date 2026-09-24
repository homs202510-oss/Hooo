/**
 * 👻 PHANTOM — 60 إنجاز مترابط
 */

const ACH_CATS = {
    player:   { emoji: '👤', name: 'التقدم' },
    economy:  { emoji: '💰', name: 'الاقتصاد' },
    trade:    { emoji: '🛒', name: 'التجارة' },
    items:    { emoji: '🎒', name: 'العناصر' },
    resource: { emoji: '⛏️', name: 'الموارد' },
    kingdom:  { emoji: '🏰', name: 'المملكة' },
    upgrade:  { emoji: '📈', name: 'التطوير' },
    army:     { emoji: '⚔️', name: 'الجيش' },
    defense:  { emoji: '🛡️', name: 'الدفاع' },
    war:      { emoji: '🔥', name: 'الحروب' },
    alliance: { emoji: '🤝', name: 'التحالفات' },
    mission:  { emoji: '🎯', name: 'المهام' },
    explore:  { emoji: '🗺️', name: 'الاستكشاف' },
    adventure:{ emoji: '🎢', name: 'المغامرات' },
    rare:     { emoji: '💎', name: 'النادرة' },
};

function A(id, name, desc, cat, cond, target, rewards, title = null) {
    return { id, name, desc, cat, condition: cond, target, rewards, title };
}

const ACHIEVEMENTS = [
    // 👤 التقدم (5)
    A('p_first_step', 'أول خطوة', 'ابدأ رحلتك', 'player', { k: 'always' }, 1, { coins: 50, xp: 20 }),
    A('p_work_10', 'عامل مجتهد', 'اشتغل 10 مرات', 'player', { k: 'work_count' }, 10, { coins: 200, xp: 100 }),
    A('p_work_100', 'موظف مثالي', 'اشتغل 100 مرة', 'player', { k: 'work_count' }, 100, { coins: 2000, xp: 1000 }, '🏷️ العامل'),
    A('p_daily_30', 'ملتزم', 'خد المكافأة 30 مرة', 'player', { k: 'daily_count' }, 30, { coins: 3000, xp: 1500 }, '🏷️ المخلص'),
    A('p_level_10', 'خبير', 'وصل Level 10', 'player', { k: 'user_level' }, 10, { coins: 5000, xp: 2000 }, '🏷️ الخبير'),

    // 💰 الاقتصاد (5)
    A('e_rich_10k', 'ثري صغير', 'امتلك 10,000 نقطة', 'economy', { k: 'coins_amount' }, 10000, { coins: 500, xp: 300 }),
    A('e_rich_100k', 'مليونير', 'امتلك 100,000 نقطة', 'economy', { k: 'coins_amount' }, 100000, { coins: 10000, xp: 5000 }, '🏷️ الثري'),
    A('e_rich_1m', 'مليونير محترف', 'امتلك 1,000,000 نقطة', 'economy', { k: 'coins_amount' }, 1000000, { coins: 100000, xp: 50000 }, '🏷️ الممول'),
    A('e_transfer_20', 'كريم', 'حوّل 20 مرة', 'economy', { k: 'transfer_count' }, 20, { coins: 1000, xp: 500 }),
    A('e_transfer_200', 'سخي', 'حوّل 200 مرة', 'economy', { k: 'transfer_count' }, 200, { coins: 10000, xp: 5000 }, '🏷️ السخي'),

    // 🛒 التجارة (5)
    A('t_buy_1', 'أول شراء', 'اشتري من السوق', 'trade', { k: 'market_buys' }, 1, { coins: 100, xp: 50 }),
    A('t_buy_25', 'مشتري دائم', 'اشتري 25 مرة', 'trade', { k: 'market_buys' }, 25, { coins: 1000, xp: 500 }),
    A('t_sell_10', 'بائع مبتدئ', 'بيع 10 مرات', 'trade', { k: 'market_sells' }, 10, { coins: 500, xp: 250 }),
    A('t_sell_100', 'تاجر', 'بيع 100 مرة', 'trade', { k: 'market_sells' }, 100, { coins: 5000, xp: 2500 }, '🏷️ التاجر'),
    A('t_master', 'تاجر محترف', '50 شراء + 50 بيع', 'trade', { k: 'trade_total' }, 100, { coins: 10000, xp: 5000 }, '🏷️ سيد التجارة'),

    // 🎒 العناصر (5)
    A('i_first', 'أول عنصر', 'امتلك عنصر واحد', 'items', { k: 'inventory_items' }, 1, { coins: 50, xp: 20 }),
    A('i_100', 'جامع', 'امتلك 100 عنصر', 'items', { k: 'inventory_items' }, 100, { coins: 500, xp: 250 }),
    A('i_500', 'كنز', 'امتلك 500 عنصر', 'items', { k: 'inventory_items' }, 500, { coins: 3000, xp: 1500 }, '🏷️ الجامع'),
    A('i_types_20', 'متنوع', '20 نوع مختلف', 'items', { k: 'inventory_types' }, 20, { coins: 2000, xp: 1000 }),
    A('i_types_50', 'كامل', '50 نوع مختلف', 'items', { k: 'inventory_types' }, 50, { coins: 10000, xp: 5000 }, '🏷️ الكامل'),

    // ⛏️ الموارد (5)
    A('r_wood_1k', 'حطاب', 'جمع 1000 خشب', 'resource', { k: 'res_wood_total' }, 1000, { coins: 300, xp: 150 }),
    A('r_stone_1k', 'بنّاء حجر', 'جمع 1000 حجر', 'resource', { k: 'res_stone_total' }, 1000, { coins: 300, xp: 150 }),
    A('r_iron_1k', 'حداد', 'جمع 1000 حديد', 'resource', { k: 'res_iron_total' }, 1000, { coins: 500, xp: 250 }, '🏷️ الحداد'),
    A('r_gold_10k', 'خزنة', 'جمع 10,000 ذهب', 'resource', { k: 'res_gold_total' }, 10000, { coins: 2000, xp: 1000 }, '🏷️ الخزنة'),
    A('r_all_50k', 'ثروة', '50,000 من كل مورد', 'resource', { k: 'res_all_50k' }, 1, { coins: 20000, xp: 10000 }, '🏷️ الثروة'),

    // 🏰 المملكة (5)
    A('k_kingdom_1', 'مؤسس', 'أنشئ مملكة', 'kingdom', { k: 'has_kingdom' }, 1, { coins: 200, xp: 100 }),
    A('k_level_5', 'نمو', 'مملكة Lv5', 'kingdom', { k: 'kingdom_level' }, 5, { coins: 500, xp: 250 }),
    A('k_level_15', 'قوة', 'مملكة Lv15', 'kingdom', { k: 'kingdom_level' }, 15, { coins: 3000, xp: 1500 }, '🏷️ السيد'),
    A('k_level_30', 'عظمة', 'مملكة Lv30', 'kingdom', { k: 'kingdom_level' }, 30, { coins: 20000, xp: 10000 }, '🏷️ العظيم'),
    A('k_level_50', 'أسطورة', 'مملكة Lv50', 'kingdom', { k: 'kingdom_level' }, 50, { coins: 100000, xp: 50000 }, '🏷️ أسطورة المملكة'),

    // 📈 التطوير (4)
    A('up_b_10', 'بنّاء', '10 مباني', 'upgrade', { k: 'buildings_count' }, 10, { coins: 300, xp: 150 }, '🏷️ البنّاء'),
    A('up_b_50', 'مهندس', '50 مبنى', 'upgrade', { k: 'buildings_count' }, 50, { coins: 3000, xp: 1500 }, '🏷️ المهندس'),
    A('up_b_100', 'معماري', '100 مبنى', 'upgrade', { k: 'buildings_count' }, 100, { coins: 10000, xp: 5000 }, '🏷️ المعماري'),
    A('up_b_500', 'أسطورة البناء', '500 مبنى', 'upgrade', { k: 'buildings_count' }, 500, { coins: 50000, xp: 25000 }, '🏷️ أسطورة البناء'),

    // ⚔️ الجيش (5)
    A('a_army_10', 'مجند', '10 جنود', 'army', { k: 'army_count' }, 10, { coins: 200, xp: 100 }),
    A('a_army_100', 'قائد سرية', '100 جندي', 'army', { k: 'army_count' }, 100, { coins: 1000, xp: 500 }, '🏷️ القائد'),
    A('a_army_1k', 'جنرال', '1000 جندي', 'army', { k: 'army_count' }, 1000, { coins: 10000, xp: 5000 }, '🏷️ الجنرال'),
    A('a_army_10k', 'فيلد مارشال', '10,000 جندي', 'army', { k: 'army_count' }, 10000, { coins: 100000, xp: 50000 }, '🏷️ الفيلد مارشال'),
    A('a_train_50', 'مدرب', '50 تدريب', 'army', { k: 'train_count' }, 50, { coins: 2000, xp: 1000 }, '🏷️ المدرب'),

    // 🛡️ الدفاع (3)
    A('d_walls_5', 'محصّن', '5 أسوار', 'defense', { k: 'building_type_count', type: 'سور', count: 5 }, 5, { coins: 500, xp: 250 }),
    A('d_walls_20', 'قلعة', '20 سور', 'defense', { k: 'building_type_count', type: 'سور', count: 20 }, 20, { coins: 5000, xp: 2500 }, '🏷️ القلعة'),
    A('d_def_10k', 'حصن حصين', '10,000 دفاع', 'defense', { k: 'defense_total' }, 10000, { coins: 10000, xp: 5000 }, '🏷️ الحصن'),

    // 🔥 الحروب (5)
    A('w_first', 'محارب', 'أول هجوم', 'war', { k: 'attack_count' }, 1, { coins: 200, xp: 100 }),
    A('w_win_5', 'منتصر', '5 انتصارات', 'war', { k: 'wins_count' }, 5, { coins: 1000, xp: 500 }, '🏷️ المنتصر'),
    A('w_win_25', 'فاتح', '25 انتصار', 'war', { k: 'wins_count' }, 25, { coins: 5000, xp: 2500 }, '🏷️ الفاتح'),
    A('w_win_100', 'غالب', '100 انتصار', 'war', { k: 'wins_count' }, 100, { coins: 50000, xp: 25000 }, '🏷️ الغالب'),
    A('w_win_500', 'فاتح الأقاليم', '500 انتصار', 'war', { k: 'wins_count' }, 500, { coins: 500000, xp: 250000 }, '🏷️ فاتح الأقاليم'),

    // 🤝 التحالفات (3)
    A('al_first', 'دبلوماسي', 'أول تحالف', 'alliance', { k: 'alliances_count' }, 1, { coins: 300, xp: 150 }),
    A('al_3', 'سياسي', '3 تحالفات', 'alliance', { k: 'alliances_count' }, 3, { coins: 1500, xp: 750 }, '🏷️ السياسي'),
    A('al_5', 'ملك الدبلوماسية', '5 تحالفات', 'alliance', { k: 'alliances_count' }, 5, { coins: 10000, xp: 5000 }, '🏷️ ملك الدبلوماسية'),

    // 🎯 المهام (5)
    A('m_5', 'مبتدئ المهام', '5 مهام', 'mission', { k: 'missions_completed' }, 5, { coins: 300, xp: 150 }),
    A('m_20', 'مهمّ', '20 مهمة', 'mission', { k: 'missions_completed' }, 20, { coins: 2000, xp: 1000 }, '🏷️ المهمّ'),
    A('m_50', 'منجز', '50 مهمة', 'mission', { k: 'missions_completed' }, 50, { coins: 10000, xp: 5000 }, '🏷️ المنجز'),
    A('m_80', 'أسطورة المهام', '80 مهمة', 'mission', { k: 'missions_completed' }, 80, { coins: 100000, xp: 50000 }, '🏷️ أسطورة المهام'),
    A('m_110', 'كامل', '110 مهمة', 'mission', { k: 'missions_completed' }, 110, { coins: 500000, xp: 250000 }, '🏷️ الكامل'),

    // 🗺️ الاستكشاف (5)
    A('x_first', 'مستكشف', 'أول استكشاف', 'explore', { k: 'explorations_count' }, 1, { coins: 100, xp: 50 }),
    A('x_10', 'رحّالة', '10 استكشافات', 'explore', { k: 'explorations_count' }, 10, { coins: 500, xp: 250 }, '🏷️ الرحّالة'),
    A('x_100', 'مستكشف محترف', '100 استكشاف', 'explore', { k: 'explorations_count' }, 100, { coins: 5000, xp: 2500 }, '🏷️ المستكشف'),
    A('x_500', 'جغرافي', '500 استكشاف', 'explore', { k: 'explorations_count' }, 500, { coins: 50000, xp: 25000 }, '🏷️ الجغرافي'),
    A('x_all_areas', 'خريطة كاملة', 'كل المناطق', 'explore', { k: 'areas_visited' }, 7, { coins: 100000, xp: 50000 }, '🏷️ فاتح الحدود'),

    // 🎢 المغامرات (3)
    A('adv_1', 'مغامر', 'أول مغامرة', 'adventure', { k: 'adventures_count' }, 1, { coins: 150, xp: 75 }),
    A('adv_20', 'مغامر محترف', '20 مغامرة', 'adventure', { k: 'adventures_count' }, 20, { coins: 2000, xp: 1000 }, '🏷️ المغامر'),
    A('adv_win_50', 'منتصر المغامرات', '50 انتصار مغامرة', 'adventure', { k: 'adventures_won' }, 50, { coins: 10000, xp: 5000 }, '🏷️ منتصر المغامرات'),

    // 💎 النادرة (5)
    A('ra_first', 'نادر', 'أول عنصر نادر', 'rare', { k: 'rare_count' }, 1, { coins: 300, xp: 150 }),
    A('ra_10', 'جامع النوادر', '10 عناصر نادرة', 'rare', { k: 'rare_count' }, 10, { coins: 3000, xp: 1500 }, '🏷️ جامع النوادر'),
    A('ra_100', 'خبير النوادر', '100 عنصر نادر', 'rare', { k: 'rare_count' }, 100, { coins: 30000, xp: 15000 }, '🏷️ خبير النوادر'),
    A('ra_special', 'خاص', 'عنصر من الفئة الخاصة', 'rare', { k: 'special_count' }, 1, { coins: 10000, xp: 5000 }, '🏷️ المميز'),
    A('ra_sword_dev', 'أسطورة PHANTOM', 'امتلك السيف المطوّر', 'rare', { k: 'has_sword_dev' }, 1, { coins: 1000000, xp: 500000 }, '🏷️ أسطورة PHANTOM'),
];

const ACH_MAP = new Map(ACHIEVEMENTS.map(a => [a.id, a]));
function getAchievement(id) { return ACH_MAP.get(id); }
function getAllAchievements() { return ACHIEVEMENTS; }

module.exports = { ACH_CATS, ACHIEVEMENTS, ACH_MAP, getAchievement, getAllAchievements };
