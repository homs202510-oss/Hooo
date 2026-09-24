/**
 * 👻 Moderation Service (ban/mute)
 */
const db = require('./core-database');

// ═══ Bans ═══
function isBanned(groupJid, userJid) {
    return !!db.prepare('SELECT id FROM group_bans WHERE group_jid = ? AND user_jid = ?').get(groupJid, userJid);
}

function ban(groupJid, userJid, reason, byJid) {
    db.prepare('INSERT OR REPLACE INTO group_bans (group_jid, user_jid, reason, banned_by) VALUES (?, ?, ?, ?)')
      .run(groupJid, userJid, reason, byJid);
}

function unban(groupJid, userJid) {
    db.prepare('DELETE FROM group_bans WHERE group_jid = ? AND user_jid = ?').run(groupJid, userJid);
}

function listBans(groupJid) {
    return db.prepare('SELECT * FROM group_bans WHERE group_jid = ?').all(groupJid);
}

// ═══ Mutes ═══
function isMuted(groupJid, userJid) {
    const m = db.prepare('SELECT * FROM group_mutes WHERE group_jid = ? AND user_jid = ?').get(groupJid, userJid);
    if (!m) return false;
    if (m.expires_at && m.expires_at < Math.floor(Date.now() / 1000)) {
        db.prepare('DELETE FROM group_mutes WHERE id = ?').run(m.id);
        return false;
    }
    return true;
}

function mute(groupJid, userJid, reason, byJid, expiresAt) {
    db.prepare('INSERT OR REPLACE INTO group_mutes (group_jid, user_jid, reason, muted_by, expires_at) VALUES (?, ?, ?, ?, ?)')
      .run(groupJid, userJid, reason, byJid, expiresAt || null);
}

function unmute(groupJid, userJid) {
    db.prepare('DELETE FROM group_mutes WHERE group_jid = ? AND user_jid = ?').run(groupJid, userJid);
}

function listMutes(groupJid) {
    const now = Math.floor(Date.now() / 1000);
    db.prepare("DELETE FROM group_mutes WHERE group_jid = ? AND expires_at IS NOT NULL AND expires_at < ?").run(groupJid, now);
    return db.prepare('SELECT * FROM group_mutes WHERE group_jid = ?').all(groupJid);
}

module.exports = {
    isBanned, ban, unban, listBans,
    isMuted, mute, unmute, listMutes,
};
