/**
 * 👻 PHANTOM — Conversation Mode
 * يدير حالات المحادثة (فردي + مجموعة)
 */
const db = require('./core-database');

// ═══════════════════════════════════════════
// حالة المستخدم
// ═══════════════════════════════════════════
function getUserState(jid) {
    return db.prepare('SELECT * FROM conversation_users WHERE user_jid = ?').get(jid);
}

function isUserEnabled(jid) {
    const s = getUserState(jid);
    return s && s.enabled === 1;
}

function enableUser(jid, activatedBy) {
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`INSERT OR REPLACE INTO conversation_users (user_jid, enabled, activated_at, activated_by, deactivated_at)
        VALUES (?, 1, ?, ?, NULL)`).run(jid, now, activatedBy || jid);
}

function disableUser(jid) {
    const now = Math.floor(Date.now() / 1000);
    const existing = getUserState(jid);
    if (!existing) {
        db.prepare('INSERT INTO conversation_users (user_jid, enabled, deactivated_at) VALUES (?, 0, ?)').run(jid, now);
        return;
    }
    db.prepare('UPDATE conversation_users SET enabled = 0, deactivated_at = ? WHERE user_jid = ?').run(now, jid);
}

// ═══════════════════════════════════════════
// حالة المجموعة
// ═══════════════════════════════════════════
function getGroupState(jid) {
    return db.prepare('SELECT * FROM conversation_groups WHERE group_jid = ?').get(jid);
}

function isGroupEnabled(jid) {
    const s = getGroupState(jid);
    return s && s.enabled === 1;
}

function enableGroup(jid, activatedBy) {
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`INSERT OR REPLACE INTO conversation_groups (group_jid, enabled, activated_at, activated_by, deactivated_at)
        VALUES (?, 1, ?, ?, NULL)`).run(jid, now, activatedBy || jid);
}

function disableGroup(jid) {
    const now = Math.floor(Date.now() / 1000);
    const existing = getGroupState(jid);
    if (!existing) {
        db.prepare('INSERT INTO conversation_groups (group_jid, enabled, deactivated_at) VALUES (?, 0, ?)').run(jid, now);
        return;
    }
    db.prepare('UPDATE conversation_groups SET enabled = 0, deactivated_at = ? WHERE group_jid = ?').run(now, jid);
}

// ═══════════════════════════════════════════
// فحص هل المستخدم أو مجموعته مفعّلين
// ═══════════════════════════════════════════
function isActive(jid, isGroup) {
    if (isUserEnabled(jid)) return true;
    if (isGroup && isGroupEnabled(jid)) return true;
    return false;
}

module.exports = {
    getUserState, isUserEnabled, enableUser, disableUser,
    getGroupState, isGroupEnabled, enableGroup, disableGroup,
    isActive,
};
