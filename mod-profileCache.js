/**
 * 👻 PHANTOM — Profile Cache
 * يخلي صورة البوت تظهر مع الأوامر (مرة كل 30 دقيقة لكل مستخدم)
 */
const db = require('./core-database');

const CACHE_TTL_SEC = 30 * 60; // 30 دقيقة

function ensureTable() {
    try {
        db.exec(`CREATE TABLE IF NOT EXISTS profile_shown (
            user_jid TEXT PRIMARY KEY,
            last_shown_at INTEGER DEFAULT 0
        )`);
    } catch (_) {}
}
ensureTable();

function shouldShow(jid, force = false) {
    if (force) return true;
    const row = db.prepare('SELECT last_shown_at FROM profile_shown WHERE user_jid = ?').get(jid);
    if (!row) return true;
    const now = Math.floor(Date.now() / 1000);
    return (now - row.last_shown_at) > CACHE_TTL_SEC;
}

function markShown(jid) {
    const now = Math.floor(Date.now() / 1000);
    db.prepare('INSERT OR REPLACE INTO profile_shown (user_jid, last_shown_at) VALUES (?, ?)').run(jid, now);
}

module.exports = { shouldShow, markShown, CACHE_TTL_SEC };
