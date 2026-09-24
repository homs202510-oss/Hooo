/**
 * 👻 PHANTOM — Production Service (يستخدم Kingdom + Army)
 */
const kd = require('./mod-kingdom');
const mil = require('./mod-military');
const balance = require('./mod-balance-advanced').production;

/**
 * الإنتاج لكل ساعة
 */
function getProduction(kingdomId) {
    return kd.getProductionPerHour(kingdomId);
}

/**
 * استهلاك الجيش لكل ساعة
 */
function getConsumption(kingdomId) {
    const army = mil.getArmy(kingdomId);
    let food = 0;
    for (const u of army) {
        const rate = balance.armyConsumption[u.type] || 1;
        food += rate * u.count;
    }
    return { food };
}

/**
 * الفرق (net)
 */
function getNet(kingdomId) {
    const prod = getProduction(kingdomId);
    const cons = getConsumption(kingdomId);
    const net = {};
    const allRes = new Set([...Object.keys(prod), ...Object.keys(cons)]);

    for (const r of allRes) {
        const p = prod[r] || 0;
        const c = cons[r] || 0;
        net[r] = { production: p, consumption: c, net: p - c };
    }

    return net;
}

module.exports = { getProduction, getConsumption, getNet };
