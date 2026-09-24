/**
 * 👻 Group State Service
 */
const db = require('./core-database');

function getState(groupJid) {
    let s = db.prepare('SELECT * FROM group_states WHERE group_jid = ?').get(groupJid);
    if (!s) {
        db.prepare('INSERT INTO group_states (group_jid) VALUES (?)').run(groupJid);
        s = db.prepare('SELECT * FROM group_states WHERE group_jid = ?').get(groupJid);
    }
    return s;
}

function isEnabled(groupJid) {
    const s = getState(groupJid);
    return s.enabled === 1;
}

function enable(groupJid, byJid) {
    getState(groupJid);
    db.prepare("UPDATE group_states SET enabled = 1, enabled_at = strftime('%s','now'), enabled_by = ?, disabled_at = NULL WHERE group_jid = ?")
      .run(byJid, groupJid);
}

function disable(groupJid) {
    getState(groupJid);
    db.prepare("UPDATE group_states SET enabled = 0, disabled_at = strftime('%s','now') WHERE group_jid = ?")
      .run(groupJid);
}

module.exports = { getState, isEnabled, enable, disable };
