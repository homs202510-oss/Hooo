/**
 * 👻 PHANTOM — Balance Advanced (61-70)
 */
module.exports = {
    // ═══ المزادات ═══
    auction: {
        minStartPrice: 10,
        maxStartPrice: 10000000,
        minIncrement: 10,
        defaultDuration: 24 * 60 * 60,  // 24 ساعة
        maxDuration: 7 * 24 * 60 * 60,  // 7 أيام
        maxActivePerUser: 5,
        feePercent: 2,                   // 2% رسوم على البيع
        minQuantity: 1,
        maxQuantity: 100000,
    },

    // ═══ المخزن ═══
    warehouse: {
        baseCapacity: 5000,
        capacityPerLevel: 2500,
        maxLevel: 20,
        upgradeCostBase: 1000,
        upgradeCostMult: 1.8,
    },

    // ═══ المصنع ═══
    factory: {
        baseCapacity: 3,
        capacityPerLevel: 2,
        maxLevel: 15,
        upgradeCostBase: 5000,
        upgradeCostMult: 2.2,
        recipes: {
            tool:     { name: 'أداة 🔧',   inputs: { wood: 50, iron: 20 },       timeSec: 30 * 60, output: { item: 'shovel', qty: 1 }, xp: 10 },
            sword:    { name: 'سيف ⚔️',    inputs: { iron: 100, wood: 30 },      timeSec: 60 * 60, output: { item: 'iron_sw', qty: 1 }, xp: 20 },
            armor:    { name: 'درع 🛡️',    inputs: { iron: 150, stone: 50 },     timeSec: 90 * 60, output: { item: 'iron_ar', qty: 1 }, xp: 30 },
            bread:    { name: 'خبز 🍞',    inputs: { food: 100 },                timeSec: 15 * 60, output: { item: 'food', qty: 200 }, xp: 5 },
            plank:    { name: 'خشب مصقول', inputs: { wood: 100 },                timeSec: 20 * 60, output: { item: 'wood', qty: 150 }, xp: 5 },
        },
    },

    // ═══ الإنتاج ═══
    production: {
        buildingRates: {
            'مزرعة': { food: 100 },
            'منجم':  { iron: 50, stone: 100 },
            'منزل':  {},
            'مخزن':  {},
            'سور':   {},
            'ثكنة':  {},
        },
        armyConsumption: {
            'مشاة':  1,
            'رماة':  1,
            'فرسان': 3,
            'درع':   2,
            'سريع':  1,
        },
    },

    // ═══ الضرائب ═══
    tax: {
        min: 0,
        max: 25,
        default: 5,
        changeCooldownHours: 24,
        treasurySplit: 0.3,     // 30% من الضريبة للخزينة، الباقي رصيد
    },

    // ═══ الخزينة ═══
    treasury: {
        minWithdraw: 1000,
        maxBalance: 500000000,   // 500 مليون
        withdrawFeePercent: 1,
        allowedRoles: ['kingdom_owner', 'kingdom_admin'],
    },
};
