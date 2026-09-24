/**
 * 👻 PHANTOM — Tax Service
 */
const db = require('./core-database');
const balance = require('./mod-balance-advanced').tax;
const events = require('./mod-events');

function ensure(kingdomId) {
    let t = db.prepare('SELECT * FROM kingdom_tax WHERE kingdom_id = ?').get(kingdomId);
    if (!t) {
        db.prepare('INSERT INTO kingdom_tax (kingdom_id) VALUES (?)').run(kingdomId);
        t = db.prepare('SELECT * FROM kingdom_tax WHERE kingdom_id = ?').get(kingdomId);
    }
    return t;
}

function get(kingdomId) {
    return ensure(kingdomId);
}

function set(kingdomId, rate, changedBy) {
    if (!Number.isInteger(rate) || rate < balance.min || rate > balance.max)
        return { ok: false, reason: 'bad_rate', min: balance.min, max: balance.max };

    const t = ensure(kingdomId);
    const now = Math.floor(Date.now() / 1000);
    const cooldown = balance.changeCooldownHours * 3600;

    if (now - t.last_change < cooldown) {
        const wait = cooldown - (now - t.last_change);
        return { ok: false, reason: 'cooldown', wait };
    }

    db.prepare('UPDATE kingdom_tax SET rate = ?, last_change = ?, changed_by = ? WHERE kingdom_id = ?')
      .run(rate, now, changedBy, kingdomId);

    events.emit('tax_changed', { kingdom_id: kingdomId, rate, changed_by: changedBy });

    return { ok: true, rate };
}

/**
 * احسب دخل الضريبة المتوقع (من إنتاج المملكة)
 */
function calculateExpectedIncome(kingdomId) {
    const prod = require('./mod-production').getProduction(kingdomId);
    const t = ensure(kingdomId);

    // احسب القيمة التقريبية للموارد
    const resValues = { wood: 8, stone: 10, food: 12, gold: 80, iron: 25 };
    let totalValue = 0;

    for (const [res, amt] of Object.entries(prod)) {
        totalValue += (amt || 0) * (resValues[res] || 10);
    }

    const income = Math.floor(totalValue * (t.rate / 100) * balance.treasurySplit);
    return { rate: t.rate, totalValue, income };
}

module.exports = { get, set, calculateExpectedIncome };
