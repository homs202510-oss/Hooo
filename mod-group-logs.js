/**
 * 👻 Admin Log Service
 */
const db = require('./core-database');

function log(groupJid, action, actorJid, targetJid, details) {
    try {
        db.prepare('INSERT INTO admin_logs (group_jid, action, actor_jid, target_jid, details) VALUES (?, ?, ?, ?, ?)')
          .run(groupJid, action, actorJid || null, targetJid || null, details || null);
    } catch (_) {}
}

function getRecent(groupJid, limit) {
    limit = limit || 15;
    return db.prepare('SELECT * FROM admin_logs WHERE group_jid = ? ORDER BY created_at DESC LIMIT ?').all(groupJid, limit);
}

module.exports = { log, getRecent };
