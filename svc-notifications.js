/**
 * 👻 PHANTOM — Notifications Service
 */
const db = require('./core-database');

function notify(userJid, type, text) {
    try {
        db.prepare('INSERT INTO notifications (user_jid, type, text) VALUES (?, ?, ?)')
          .run(userJid, type, text);
        return true;
    } catch (_) { return false; }
}

function getUnread(userJid, limit = 15) {
    return db.prepare('SELECT * FROM notifications WHERE user_jid = ? AND is_read = 0 ORDER BY created_at DESC LIMIT ?').all(userJid, limit);
}

function getRecent(userJid, limit = 15) {
    return db.prepare('SELECT * FROM notifications WHERE user_jid = ? ORDER BY created_at DESC LIMIT ?').all(userJid, limit);
}

function markRead(userJid, id) {
    try {
        db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_jid = ?').run(id, userJid);
    } catch (_) {}
}

function markAllRead(userJid) {
    try {
        db.prepare('UPDATE notifications SET is_read = 1 WHERE user_jid = ?').run(userJid);
        return true;
    } catch (_) { return false; }
}

function clear(userJid) {
    try {
        db.prepare('DELETE FROM notifications WHERE user_jid = ?').run(userJid);
        return true;
    } catch (_) { return false; }
}

function getCount(userJid) {
    try {
        return db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_jid = ? AND is_read = 0').get(userJid).c;
    } catch (_) { return 0; }
}

module.exports = { notify, getUnread, getRecent, markRead, markAllRead, clear, getCount };
