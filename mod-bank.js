/**
 * 👻 Bank Service
 */
const db = require('./core-database');
const balance = require('./balance').bank || {};

const CONFIG = {
    depositFeePercent: 0,
    withdrawFeePercent: 2,
    minDeposit: 100,
    minWithdraw: 100,
    maxBalance: 100000000,
    interest: {
        ratePercent: 1,
        periodHours: 24,
        maxInterest: 50000,
    },
};

function ensure(jid) {
    let a = db.prepare('SELECT * FROM bank_accounts WHERE user_jid = ?').get(jid);
    if (!a) {
        try {
            db.prepare('INSERT INTO bank_accounts (user_jid) VALUES (?)').run(jid);
            a = db.prepare('SELECT * FROM bank_accounts WHERE user_jid = ?').get(jid);
        } catch (_) {
            return { user_jid: jid, balance: 0 };
        }
    }
    return a;
}

function getAccount(jid) {
    return ensure(jid);
}

function deposit(jid, amount) {
    if (!Number.isInteger(amount) || amount < CONFIG.minDeposit) return { ok: false, reason: 'min_deposit', min: CONFIG.minDeposit };

    const user = require('./mod-user');
    const bal = user.getCoins(jid);
    if (bal < amount) return { ok: false, reason: 'no_coins', have: bal };

    try {
        db.exec('BEGIN IMMEDIATE');
        const a = ensure(jid);
        if (a.balance + amount > CONFIG.maxBalance) { db.exec('ROLLBACK'); return { ok: false, reason: 'max' }; }

        user.removeCoins(jid, amount);
        db.prepare('UPDATE bank_accounts SET balance = balance + ?, total_deposited = total_deposited + ? WHERE user_jid = ?')
          .run(amount, amount, jid);
        db.prepare('INSERT INTO bank_transactions (user_jid, action, amount) VALUES (?, ?, ?)')
          .run(jid, 'deposit', amount);
        db.exec('COMMIT');
        return { ok: true, newBalance: a.balance + amount, coins: user.getCoins(jid) };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

function withdraw(jid, amount) {
    if (!Number.isInteger(amount) || amount < CONFIG.minWithdraw) return { ok: false, reason: 'min_withdraw', min: CONFIG.minWithdraw };

    const a = ensure(jid);
    if (a.balance < amount) return { ok: false, reason: 'no_balance', have: a.balance };

    const fee = Math.floor(amount * CONFIG.withdrawFeePercent / 100);
    const net = amount - fee;

    try {
        db.exec('BEGIN IMMEDIATE');
        const user = require('./mod-user');
        db.prepare('UPDATE bank_accounts SET balance = balance - ?, total_withdrawn = total_withdrawn + ? WHERE user_jid = ?')
          .run(amount, amount, jid);
        user.addCoins(jid, net);
        db.prepare('INSERT INTO bank_transactions (user_jid, action, amount, fee) VALUES (?, ?, ?, ?)')
          .run(jid, 'withdraw', amount, fee);
        db.exec('COMMIT');
        return { ok: true, net, fee, newBalance: a.balance - amount, coins: user.getCoins(jid) };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

module.exports = { getAccount, ensure, deposit, withdraw, CONFIG };
