/**
 * 👻 PHANTOM — Reward Code Service
 */
const db = require('./core-database');  // ✅ مسار صح

function createCode(code, rewardType, rewardValue, maxUses, createdBy) {
    if (!code || String(code).length < 3) return { ok: false, reason: 'code_short' };
    if (!['points', 'wood', 'stone', 'iron', 'food', 'gold'].includes(rewardType)) {
        return { ok: false, reason: 'bad_type' };
    }
    if (!Number.isInteger(rewardValue) || rewardValue <= 0) return { ok: false, reason: 'bad_value' };
    if (!Number.isInteger(maxUses) || maxUses <= 0) return { ok: false, reason: 'bad_uses' };

    try {
        db.prepare('INSERT INTO reward_codes (code, reward_type, reward_value, max_uses, created_by) VALUES (?, ?, ?, ?, ?)')
          .run(String(code), rewardType, rewardValue, maxUses, createdBy);
        return { ok: true };
    } catch (e) {
        if (e.message.includes('UNIQUE')) return { ok: false, reason: 'exists' };
        return { ok: false, reason: 'error', error: e.message };
    }
}

function lookup(code) {
    return db.prepare('SELECT * FROM reward_codes WHERE code = ?').get(code);
}

function wasUsed(code, userJid) {
    return !!db.prepare('SELECT id FROM reward_code_uses WHERE code = ? AND user_jid = ?').get(code, userJid);
}

function redeem(code, userJid) {
    try {
        db.exec('BEGIN IMMEDIATE');

        const c = db.prepare('SELECT * FROM reward_codes WHERE code = ?').get(code);
        if (!c) { db.exec('ROLLBACK'); return { ok: false, reason: 'not_found' }; }
        if (c.status !== 'active') { db.exec('ROLLBACK'); return { ok: false, reason: 'inactive' }; }
        if (c.used_count >= c.max_uses) {
            db.prepare("UPDATE reward_codes SET status = 'expired' WHERE id = ?").run(c.id);
            db.exec('ROLLBACK');
            return { ok: false, reason: 'expired' };
        }
        if (wasUsed(code, userJid)) { db.exec('ROLLBACK'); return { ok: false, reason: 'already_used' }; }

        db.prepare('INSERT INTO reward_code_uses (code, user_jid) VALUES (?, ?)').run(code, userJid);
        db.prepare('UPDATE reward_codes SET used_count = used_count + 1 WHERE id = ?').run(c.id);

        const newCount = c.used_count + 1;
        if (newCount >= c.max_uses) {
            db.prepare("UPDATE reward_codes SET status = 'expired' WHERE id = ?").run(c.id);
        }

        db.exec('COMMIT');
        return { ok: true, code: c };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

async function grant(codeRow, userJid) {
    const user = require('./mod-user');
    const kd = require('./mod-kingdom');

    if (codeRow.reward_type === 'points') {
        user.getOrCreate(userJid);
        user.addCoins(userJid, codeRow.reward_value);
        return { type: 'points', value: codeRow.reward_value };
    }

    if (['wood', 'stone', 'iron', 'food', 'gold'].includes(codeRow.reward_type)) {
        const k = kd.getKingdom(userJid);
        if (!k) return { error: 'no_kingdom' };
        kd.addResource(k.id, codeRow.reward_type, codeRow.reward_value);
        return { type: codeRow.reward_type, value: codeRow.reward_value };
    }

    return { error: 'unknown_type' };
}

module.exports = { createCode, lookup, redeem, grant, wasUsed };
