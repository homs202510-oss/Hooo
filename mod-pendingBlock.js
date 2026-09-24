/**
 * 👻 PHANTOM — Pending Block
 * قبل ما البوت يحظر، ياخد موافقة المطور
 */
const db = require('./core-database');
const config = require('./config');

const APPROVAL_WINDOW = 120; // ثانية — المطور عنده دقيقتين

function createPending(userJid, reason) {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + APPROVAL_WINDOW;
    db.prepare('INSERT OR REPLACE INTO pending_blocks (user_jid, reason, requested_at, expires_at) VALUES (?, ?, ?, ?)')
      .run(userJid, reason, now, expiresAt);
    return expiresAt;
}

function getPending(userJid) {
    const p = db.prepare('SELECT * FROM pending_blocks WHERE user_jid = ?').get(userJid);
    if (!p) return null;
    if (p.expires_at < Math.floor(Date.now() / 1000)) {
        db.prepare('DELETE FROM pending_blocks WHERE user_jid = ?').run(userJid);
        return null;
    }
    return p;
}

function getLatestPending() {
    const now = Math.floor(Date.now() / 1000);
    return db.prepare('SELECT * FROM pending_blocks WHERE expires_at > ? ORDER BY requested_at DESC LIMIT 1').get(now);
}

function clearPending(userJid) {
    db.prepare('DELETE FROM pending_blocks WHERE user_jid = ?').run(userJid);
}

module.exports = { createPending, getPending, getLatestPending, clearPending, APPROVAL_WINDOW };
