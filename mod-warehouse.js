/**
 * 👻 PHANTOM — Kingdom Warehouse Service
 */
const db = require('./core-database');
const balance = require('./mod-balance-advanced').warehouse;

function ensure(kingdomId) {
    let w = db.prepare('SELECT * FROM kingdom_warehouse WHERE kingdom_id = ?').get(kingdomId);
    if (!w) {
        db.prepare('INSERT INTO kingdom_warehouse (kingdom_id) VALUES (?)').run(kingdomId);
        w = db.prepare('SELECT * FROM kingdom_warehouse WHERE kingdom_id = ?').get(kingdomId);
    }
    return w;
}

function get(kingdomId) {
    const w = ensure(kingdomId);
    return {
        ...w,
        used: getUsed(kingdomId),
        free: Math.max(0, w.capacity - getUsed(kingdomId)),
    };
}

function getUsed(kingdomId) {
    // احسب من kingdom_resources
    const kd = require('./mod-kingdom');
    const res = kd.getResources(kingdomId);
    return Object.values(res).reduce((s, v) => s + (v || 0), 0);
}

function canStore(kingdomId, amount) {
    const w = ensure(kingdomId);
    return getUsed(kingdomId) + amount <= w.capacity;
}

function getUpgradeCost(level) {
    return Math.floor(balance.upgradeCostBase * Math.pow(balance.upgradeCostMult, level - 1));
}

function upgrade(kingdomId) {
    const w = ensure(kingdomId);
    if (w.level >= balance.maxLevel) return { ok: false, reason: 'max_level' };

    const cost = getUpgradeCost(w.level);
    const kd = require('./mod-kingdom');
    if (kd.getResource(kingdomId, 'gold') < cost) return { ok: false, reason: 'no_gold', cost };

    try {
        db.exec('BEGIN IMMEDIATE');
        kd.addResource(kingdomId, 'gold', -cost);
        const newCap = w.capacity + balance.capacityPerLevel;
        db.prepare('UPDATE kingdom_warehouse SET level = level + 1, capacity = ?, upgraded_at = strftime(\'%s\',\'now\') WHERE kingdom_id = ?')
          .run(newCap, kingdomId);
        db.exec('COMMIT');
        return { ok: true, newLevel: w.level + 1, newCap };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

module.exports = { get, ensure, getUsed, canStore, upgrade, getUpgradeCost };
