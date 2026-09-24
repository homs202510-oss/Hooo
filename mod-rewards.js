const db = require('./core-database');

const CODES = {
    '20102255': { coins: 1000, name: 'كود المطور السري' },
};

function redeem(jid, code) {
    if (!code || typeof code !== 'string') return { ok: false, reason: 'invalid' };
    const clean = code.trim();
    const reward = CODES[clean];
    if (!reward) return { ok: false, reason: 'invalid' };

    const used = db.prepare('SELECT id FROM reward_codes WHERE user_jid = ? AND code = ?').get(jid, clean);
    if (used) return { ok: false, reason: 'used', name: reward.name };

    try {
        db.exec('BEGIN IMMEDIATE');
        const recheck = db.prepare('SELECT id FROM reward_codes WHERE user_jid = ? AND code = ?').get(jid, clean);
        if (recheck) { db.exec('ROLLBACK'); return { ok: false, reason: 'used', name: reward.name }; }

        const user = require('./mod-user');
        user.getOrCreate(jid);
        user.addCoins(jid, reward.coins);
        db.prepare('INSERT INTO reward_codes (user_jid, code) VALUES (?, ?)').run(jid, clean);
        db.exec('COMMIT');
        return { ok: true, name: reward.name, coins: reward.coins };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

function hasUsed(jid, code) {
    return !!db.prepare('SELECT id FROM reward_codes WHERE user_jid = ? AND code = ?').get(jid, code.trim());
}

module.exports = { redeem, hasUsed, CODES };
