const db = require('./core-database');
const config = require('./config');

const RANKS = [
    { minXP: 0,     name: '👤 عضو 🔵',       tier: 'member' },
    { minXP: 100,   name: '🥉 عضو مميز',      tier: 'premium' },
    { minXP: 500,   name: '🥈 عضو نشط',       tier: 'active' },
    { minXP: 2000,  name: '🥇 عضو ذهبي',      tier: 'gold' },
    { minXP: 10000, name: '💎 عضو أسطوري',    tier: 'legend' },
    { minXP: 50000, name: '👑 مشرف',          tier: 'admin' },
];

function getOrCreate(jid, pushName = null) {
    const existing = db.prepare('SELECT * FROM users WHERE jid = ?').get(jid);
    if (!existing) {
        db.prepare('INSERT INTO users (jid, name, push_name) VALUES (?, ?, ?)')
          .run(jid, pushName || 'مجهول', pushName);
        return db.prepare('SELECT * FROM users WHERE jid = ?').get(jid);
    }
    if (pushName && existing.push_name !== pushName) {
        db.prepare("UPDATE users SET push_name = ?, last_seen = strftime('%s','now') WHERE jid = ?")
          .run(pushName, jid);
    } else {
        db.prepare("UPDATE users SET last_seen = strftime('%s','now') WHERE jid = ?").run(jid);
    }
    return db.prepare('SELECT * FROM users WHERE jid = ?').get(jid);
}

function getRank(user) {
    const number = user.jid.split('@')[0].split(':')[0];
    if (number === config.ownerNumber) return { name: '⚡ المالك', tier: 'owner' };
    let rank = RANKS[0];
    for (const r of RANKS) if (user.xp >= r.minXP) rank = r;
    return rank;
}

function getNextRank(user) {
    const rank = getRank(user);
    if (rank.tier === 'owner') return null;
    const idx = RANKS.findIndex(r => r.name === rank.name);
    return (idx >= 0 && idx < RANKS.length - 1) ? RANKS[idx + 1] : null;
}

function getDisplayName(jid, fallback = 'مجهول') {
    const u = db.prepare('SELECT name, push_name FROM users WHERE jid = ?').get(jid);
    if (!u) return fallback;
    return u.name || u.push_name || fallback;
}

function setName(jid, name) {
    db.prepare('UPDATE users SET name = ? WHERE jid = ?').run(name, jid);
}

function addXP(jid, amount) {
    db.prepare('UPDATE users SET xp = xp + ? WHERE jid = ?').run(amount, jid);
    return db.prepare('SELECT * FROM users WHERE jid = ?').get(jid);
}

function getCoins(jid) {
    const u = db.prepare('SELECT coins FROM users WHERE jid = ?').get(jid);
    return u ? u.coins : 0;
}

function addCoins(jid, amount) {
    db.prepare('UPDATE users SET coins = coins + ? WHERE jid = ?').run(amount, jid);
    return getCoins(jid);
}

function removeCoins(jid, amount) {
    db.prepare('UPDATE users SET coins = coins - ? WHERE jid = ?').run(amount, jid);
    return getCoins(jid);
}

function setCoins(jid, amount) {
    db.prepare('UPDATE users SET coins = ? WHERE jid = ?').run(amount, jid);
}

function transferCoins(fromJid, toJid, amount) {
    try {
        db.exec('BEGIN IMMEDIATE');
        const sender = db.prepare('SELECT coins FROM users WHERE jid = ?').get(fromJid);
        if (!sender || sender.coins < amount) {
            db.exec('ROLLBACK');
            return { ok: false, reason: 'insufficient' };
        }
        db.prepare('UPDATE users SET coins = coins - ? WHERE jid = ?').run(amount, fromJid);
        db.prepare('UPDATE users SET coins = coins + ? WHERE jid = ?').run(amount, toJid);
        db.exec('COMMIT');
        return { ok: true };
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        return { ok: false, reason: 'error', error: e.message };
    }
}

function getInventoryCount(jid) {
    const r = db.prepare('SELECT SUM(quantity) as total FROM inventory WHERE user_jid = ?').get(jid);
    return r?.total || 0;
}

function getInventory(jid) {
    return db.prepare('SELECT * FROM inventory WHERE user_jid = ? ORDER BY item_type, item_name').all(jid);
}

function addItem(jid, itemType, itemName, quantity = 1) {
    const existing = db.prepare('SELECT * FROM inventory WHERE user_jid = ? AND item_type = ? AND item_name = ?')
        .get(jid, itemType, itemName);
    if (existing) {
        db.prepare('UPDATE inventory SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
    } else {
        db.prepare('INSERT INTO inventory (user_jid, item_type, item_name, quantity) VALUES (?, ?, ?, ?)')
          .run(jid, itemType, itemName, quantity);
    }
}

function isOwner(jid) {
    return jid.split('@')[0].split(':')[0] === config.ownerNumber;
}

function getTopByCoins(limit = 10) {
    return db.prepare(`
        SELECT jid, name, push_name, coins
        FROM users
        WHERE coins > 0
        ORDER BY coins DESC
        LIMIT ?
    `).all(limit);
}

function getCooldown(jid, column) {
    const u = db.prepare(`SELECT ${column} FROM users WHERE jid = ?`).get(jid);
    return u ? (u[column] || 0) : 0;
}

function setCooldown(jid, column, timestamp) {
    db.prepare(`UPDATE users SET ${column} = ? WHERE jid = ?`).run(timestamp, jid);
}

module.exports = {
    RANKS,
    getOrCreate,
    getRank,
    getNextRank,
    getDisplayName,
    setName,
    addXP,
    getCoins,
    addCoins,
    removeCoins,
    setCoins,
    transferCoins,
    getInventory,
    getInventoryCount,
    addItem,
    isOwner,
    getTopByCoins,
    getCooldown,
    setCooldown,
};
