/**
 * 👻 Group Settings Service
 */
const db = require('./core-database');

function get(groupJid) {
    let s = db.prepare('SELECT * FROM group_settings WHERE group_jid = ?').get(groupJid);
    if (!s) {
        db.prepare('INSERT INTO group_settings (group_jid) VALUES (?)').run(groupJid);
        s = db.prepare('SELECT * FROM group_settings WHERE group_jid = ?').get(groupJid);
    }
    return s;
}

function set(groupJid, key, value) {
    const allowed = ['link_protection', 'mention_protection', 'image_protection', 'video_protection', 'file_protection', 'welcome', 'welcome_text', 'goodbye', 'goodbye_text'];
    if (!allowed.includes(key)) return false;
    get(groupJid);
    db.prepare(`UPDATE group_settings SET ${key} = ?, updated_at = strftime('%s','now') WHERE group_jid = ?`)
      .run(value, groupJid);
    return true;
}

function toggle(groupJid, key) {
    const s = get(groupJid);
    const newVal = s[key] === 1 ? 0 : 1;
    set(groupJid, key, newVal);
    return newVal;
}

module.exports = { get, set, toggle };
