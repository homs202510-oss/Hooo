const db = require('./core-database');

/**
 * طبقة حساب مركزية — كل الأوامر تستخدمها
 */

function getKingdomFullStats(kingdomId) {
    const kd = require('./mod-kingdom');
    const mil = require('./mod-military');

    const kingdom = db.prepare('SELECT * FROM kingdoms WHERE id = ?').get(kingdomId);
    if (!kingdom) return null;

    const resources = kd.getResources(kingdomId);
    const production = kd.getProductionPerHour(kingdomId);
    const armyStats = mil.getArmyStats(kingdomId);
    const buildings = kd.getBuildings(kingdomId);
    const itemBonuses = kd.getKingdomBonuses(kingdomId);
    const allianceBonus = (() => {
        try { return require('./mod-diplomacy').getAllianceBonus(kingdomId); } catch (_) { return { count: 0, production: 0, defense: 0 }; }
    })();

    // تكلفة تشغيل الجيش (food/س)
    const operationalCost = armyStats.food;

    // قيمة المملكة
    const value = kingdom.power * 100 + armyStats.attack + armyStats.defense + Object.values(resources).reduce((s, v) => s + v, 0) * 2;

    return {
        kingdom, resources, production, armyStats, buildings,
        itemBonuses, allianceBonus, operationalCost, value,
        armyCount: armyStats.count,
    };
}

function getEconomyStats(kingdomId) {
    const stats = getKingdomFullStats(kingdomId);
    if (!stats) return null;

    // الدخل/س (تقديري)
    const incomePerHour = Object.values(stats.production).reduce((s, v) => s + v, 0);

    // المصروفات (استهلاك الجيش من الطعام)
    const foodRate = stats.production.food || 0;
    const foodConsumption = stats.operationalCost;
    const netFood = foodRate - foodConsumption;

    return {
        incomePerHour,
        foodConsumption,
        netFood,
        foodStability: netFood >= 0 ? 'مستقر' : 'مجاعة',
        totalValue: stats.value,
    };
}

module.exports = { getKingdomFullStats, getEconomyStats };
