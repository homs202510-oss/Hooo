/**
 * 👻 PHANTOM — Kingdom Treasury Service
 */
const db = require('./core-database');
const balance = require('./mod-balance-advanced').treasury;
const events = require('./mod-events');

function ensure(kingdomId) {
    let t = db.prepare('SELECT * FROM kingdom_treasury WHERE kingdom_id = ?').get(kingdomId);
    if (!t) {
        db.prepare('INSERT INTO kingdom_treasury (kingdom_id) VALUES (?)').run(kingdomId);
        t = db.prepare('SELECT * FROM kingdom_treasury WHERE kingdom_id = ?').get(kingdomId);
    }
    return t;
}

function get(kingdomId) {
    return ensure(kingdomId);
}

function deposit(kingdomId, amount, actorJid, details) {
    if (!Number.isInteger(amount) || amount <= 0) return { ok: false, reason: 'bad_amount' };

    const t = ensure(kingdomId);
    if (t.balance + amount > balance.maxBalance) return { ok: false, reason: 'max_balance' };

    try {
        db.exec('BEGIN IMMEDIATE');
        db.prepare('UPDATE kingdom_treasury SET balance = balance + ?, total_income = total_income + ?, updated_at = strftime(\'%s\',\'now\') WHERE kingdom_id = ?')
          .run(amount, amount, kingdomId);
        db.prepare('INSERT INTO treasury_logs (kingdom_id, action, amount, details, actor_jid) VALUES (?, ?, ?, ?, ?)')
          .run(kingdomId, 'deposit', amount, details || null, actorJid || null);
        db.exec('COMMIT');

        events.emit('treasury_deposit', { kingdom_id: kingdomId, amount, actor: actorJid });
        return { ok: true, balance: t.balance + amount };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

function withdraw(kingdomId, amount, actorJid, details) {
    if (!Number.isInteger(amount) || amount <= 0) return { ok: false, reason: 'bad_amount' };
    if (amount < balance.minWithdraw) return { ok: false, reason: 'min_withdraw', min: balance.minWithdraw };

    const t = ensure(kingdomId);
    if (t.balance < amount) return { ok: false, reason: 'no_balance', have: t.balance };

    const fee = Math.floor(amount * balance.withdrawFeePercent / 100);
    const net = amount - fee;

    try {
        db.exec('BEGIN IMMEDIATE');
        db.prepare('UPDATE kingdom_treasury SET balance = balance - ?, total_expense = total_expense + ?, updated_at = strftime(\'%s\',\'now\') WHERE kingdom_id = ?')
          .run(amount, amount, kingdomId);
        db.prepare('INSERT INTO treasury_logs (kingdom_id, action, amount, details, actor_jid) VALUES (?, ?, ?, ?, ?)')
          .run(kingdomId, 'withdraw', amount, details || null, actorJid || null);
        db.exec('COMMIT');

        events.emit('treasury_expense', { kingdom_id: kingdomId, amount, actor: actorJid });
        return { ok: true, net, fee, newBalance: t.balance - amount };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

function getLogs(kingdomId, limit = 15) {
    return db.prepare('SELECT * FROM treasury_logs WHERE kingdom_id = ? ORDER BY created_at DESC LIMIT ?').all(kingdomId, limit);
}

/**
 * تحصيل الضريبة دورياً
 */
function collectTaxes(kingdomId) {
    const tax = require('./mod-tax');
    const expected = tax.calculateExpectedIncome(kingdomId);
    if (expected.income > 0) {
        deposit(kingdomId, expected.income, 'system', `ضريبة ${expected.rate}%`);
    }
    return expected;
}

module.exports = { get, ensure, deposit, withdraw, getLogs, collectTaxes };
