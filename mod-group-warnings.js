/**
 * 👻 Warning Service v2
 * MAX = 4 (عند الرابع = كتم 24 ساعة)
 */
const db = require('./core-database');

const MAX_WARNINGS = 4;
const MUTE_DURATION_SEC = 24 * 60 * 60; // 24 ساعة

function get(groupJid, userJid) {
    return db.prepare('SELECT * FROM group_warnings WHERE group_jid = ? AND user_jid = ?').get(groupJid, userJid);
}

function getCount(groupJid, userJid) {
    const r = get(groupJid, userJid);
    return r ? r.count : 0;
}

function add(groupJid, userJid, reason, issuerJid) {
    const existing = get(groupJid, userJid);
    if (existing) {
        const newCount = existing.count + 1;
        db.prepare("UPDATE group_warnings SET count = ?, reason = ?, issuer_jid = ?, updated_at = strftime('%s','now') WHERE id = ?")
          .run(newCount, reason, issuerJid, existing.id);
        return newCount;
    } else {
        db.prepare('INSERT INTO group_warnings (group_jid, user_jid, reason, count, issuer_jid) VALUES (?, ?, ?, 1, ?)')
          .run(groupJid, userJid, reason, issuerJid);
        return 1;
    }
}

function clear(groupJid, userJid) {
    db.prepare('DELETE FROM group_warnings WHERE group_jid = ? AND user_jid = ?').run(groupJid, userJid);
}

function listAll(groupJid) {
    return db.prepare('SELECT * FROM group_warnings WHERE group_jid = ? AND count > 0').all(groupJid);
}

module.exports = { get, getCount, add, clear, listAll, MAX_WARNINGS, MUTE_DURATION_SEC };
