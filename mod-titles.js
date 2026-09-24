const db = require('./core-database');

function getTitles(jid) {
    return db.prepare('SELECT title FROM user_titles WHERE user_jid = ? ORDER BY unlocked_at').all(jid).map(r => r.title);
}

function getActiveTitle(jid) {
    const r = db.prepare('SELECT title FROM user_active_title WHERE user_jid = ?').get(jid);
    return r ? r.title : null;
}

function setActiveTitle(jid, title) {
    if (title === null) {
        db.prepare('DELETE FROM user_active_title WHERE user_jid = ?').run(jid);
        return { ok: true };
    }
    const owned = db.prepare('SELECT id FROM user_titles WHERE user_jid = ? AND title = ?').get(jid, title);
    if (!owned) return { ok: false, reason: 'not_owned' };
    db.prepare('INSERT OR REPLACE INTO user_active_title (user_jid, title) VALUES (?, ?)').run(jid, title);
    return { ok: true };
}

function unlock(jid, title) {
    try {
        db.prepare('INSERT OR IGNORE INTO user_titles (user_jid, title) VALUES (?, ?)').run(jid, title);
        return true;
    } catch (_) { return false; }
}

module.exports = { getTitles, getActiveTitle, setActiveTitle, unlock };
