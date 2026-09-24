/**
 * 👻 PHANTOM — History Service
 */
const db = require('./core-database');

function log(userJid, category, action, details, amount = 0) {
    try {
        db.prepare('INSERT INTO player_history (user_jid, category, action, details, amount) VALUES (?, ?, ?, ?, ?)')
          .run(userJid, category, action, details || null, amount);
    } catch (_) {}
}

function getRecent(userJid, limit = 10) {
    return db.prepare('SELECT * FROM player_history WHERE user_jid = ? ORDER BY created_at DESC LIMIT ?').all(userJid, limit);
}

function getByCategory(userJid, category, limit = 10) {
    return db.prepare('SELECT * FROM player_history WHERE user_jid = ? AND category = ? ORDER BY created_at DESC LIMIT ?').all(userJid, category, limit);
}

function count(userJid) {
    const r = db.prepare('SELECT COUNT(*) as c FROM player_history WHERE user_jid = ?').get(userJid);
    return r ? r.c : 0;
}

module.exports = { log, getRecent, getByCategory, count };
