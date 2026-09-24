const db = require('./core-database');

function isBlocked(jid) {
    return !!db.prepare('SELECT user_jid FROM ai_blocks WHERE user_jid = ?').get(jid);
}

function block(jid, reason = 'سلوك مخالف', by = 'ai') {
    db.prepare('INSERT OR REPLACE INTO ai_blocks (user_jid, reason, blocked_by) VALUES (?, ?, ?)')
      .run(jid, reason, by);
}

function unblock(jid) {
    db.prepare('DELETE FROM ai_blocks WHERE user_jid = ?').run(jid);
}

function getAll() {
    return db.prepare('SELECT * FROM ai_blocks ORDER BY blocked_at DESC').all();
}

module.exports = { isBlocked, block, unblock, getAll };
